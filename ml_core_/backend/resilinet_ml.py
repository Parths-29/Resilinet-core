import torch
import torch.nn.functional as F

try:
    from torch_geometric.nn import GATv2Conv
    from torch_geometric.data import Data
    GEOMETRIC_AVAILABLE = True
except ImportError:
    GEOMETRIC_AVAILABLE = False
    raise ImportError("torch_geometric not found. Run: pip install torch-geometric")

import networkx as nx
import numpy as np


class RiskGNN(torch.nn.Module):
    def __init__(self, num_features):
        super(RiskGNN, self).__init__()
        self.conv1 = GATv2Conv(num_features, 32, heads=4, concat=True, edge_dim=1)
        self.conv2 = GATv2Conv(32 * 4, 16, heads=2, concat=True, edge_dim=1)
        self.conv3 = GATv2Conv(16 * 2, 8, heads=1, concat=False, edge_dim=1)
        self.classifier = torch.nn.Linear(8, 2)

    def forward(self, x, edge_index, edge_attr):
        x = self.conv1(x, edge_index, edge_attr)
        x = F.elu(x)
        x = F.dropout(x, p=0.1, training=self.training)
        x = self.conv2(x, edge_index, edge_attr)
        x = F.elu(x)
        x = self.conv3(x, edge_index, edge_attr)
        x = F.elu(x)
        out = self.classifier(x)
        return F.softmax(out, dim=1)


def graph_to_tensor(G, history=None):
    node_map = {n: i for i, n in enumerate(G.nodes())}
    node_features = []

    all_assets = [G.nodes[n].get('assets', 1000) for n in G.nodes()]
    max_assets = max(all_assets) if all_assets else 1

    for n in G.nodes():
        node = G.nodes[n]
        assets = node.get('assets', 0) / max_assets
        cap_ratio = node.get('capital_ratio', 10)
        leverage = 1.0 / (cap_ratio + 0.1)
        degree = (G.in_degree(n) + G.out_degree(n)) / 20.0
        strategy = node.get('strategy', 0.5)

        bad_exposure = 0.0
        total_exposure = 0.1
        for neighbor in G.successors(n):
            edge_data = G.get_edge_data(n, neighbor)
            amt = edge_data.get('amount', 0)
            total_exposure += amt
            nbr_node = G.nodes[neighbor]
            if nbr_node.get('status') == 'Defaulted' or nbr_node.get('capital_ratio', 10) < 6.0:
                bad_exposure += amt

        contagion = bad_exposure / total_exposure

        risk_slope = 0.0
        if history and n in history and len(history[n]) > 0:
            prev_health = history[n][-1]['health']
            curr_health = cap_ratio
            risk_slope = (curr_health - prev_health)

        node_features.append([assets, leverage, degree, strategy, contagion, risk_slope])

    x = torch.tensor(node_features, dtype=torch.float)

    edges = []
    edge_weights = []
    for u, v, attr in G.edges(data=True):
        if u in node_map and v in node_map:
            edges.append([node_map[u], node_map[v]])
            edge_weights.append([min(attr.get('amount', 0) / 50000, 1.0)])

    if not edges:
        return None

    edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
    edge_attr = torch.tensor(edge_weights, dtype=torch.float)

    return Data(x=x, edge_index=edge_index, edge_attr=edge_attr)


model = RiskGNN(num_features=6)
optimizer = torch.optim.Adam(model.parameters(), lr=0.005)


def predict_risk(G, history=None):
    global model
    model.eval()
    data = graph_to_tensor(G, history)
    if data is None:
        return {}

    with torch.no_grad():
        predictions = model(data.x, data.edge_index, data.edge_attr)

    risk_map = {}
    nodes = list(G.nodes())
    for i, prob in enumerate(predictions):
        risk_map[nodes[i]] = float(prob[1])
    return risk_map


def train_step(G, history=None):
    global model, optimizer
    model.train()
    data = graph_to_tensor(G, history)
    if data is None:
        return

    optimizer.zero_grad()
    out = model(data.x, data.edge_index, data.edge_attr)

    labels = []
    for n in G.nodes():
        node = G.nodes[n]
        cap = node.get('capital_ratio', 10)
        is_risky = 0
        if cap < 6.0:
            is_risky = 1
        if cap < 8.0:
            for nbr in G.successors(n):
                if G.nodes[nbr].get('status') == 'Defaulted':
                    is_risky = 1
                    break
        labels.append(is_risky)

    target = torch.tensor(labels, dtype=torch.long)
    weights = torch.tensor([1.0, 3.0])
    loss = F.cross_entropy(out, target, weight=weights)
    loss.backward()
    optimizer.step()
    return float(loss)