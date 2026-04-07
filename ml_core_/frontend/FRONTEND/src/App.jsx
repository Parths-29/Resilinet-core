import React, { useEffect, useCallback, useRef, memo } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import ResultsPage from './ResultsPage';
import useSimStore from './useSimStore';
import {
  Play, RotateCcw, Activity, Cpu,
  TrendingUp, List, X, Anchor, Wind,
  Database, Info, Shield, Sword, Lock, Unlock,
  Bomb, Wallet, Terminal, Maximize, BarChart3, Radio, Wifi
} from 'lucide-react';

// ================================================================
// ERROR BOUNDARY — prevents full white-screen crashes
// ================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ResiliNet Error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020408', color: '#ef4444', fontFamily: 'monospace', gap: 16 }}>
          <div style={{ fontSize: 32, fontWeight: 900 }}>⚠ SIMULATION ERROR</div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 500, textAlign: 'center' }}>{this.state.error?.message}</div>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} style={{ padding: '8px 20px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: 6, color: '#06b6d4', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}>RELOAD SIMULATION</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ================================================================
// SIMULATOR — Full dashboard (shown after intro)
// ================================================================
export default function Simulator() {
  const {
    graph, logs, stats, round, panic, loading, mlEnabled,
    trackedNode, trackHistory, hoveredNode, hoveredLink,
    showCCPLedger, showResults, ccpData,
    setPanic, setHoveredNode, setHoveredLink,
    setGraph, setLogs, setStats, setRound, setLoading, setMlEnabled,
    setTrackedNode, setTrackHistory, setShowCCPLedger, setShowResults, setCcpData,
    reset,
  } = useSimStore();

  const graphWrapperRef = useRef(null);
  const dimensionsRef = useRef({ width: 800, height: 600 });
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });
  const fgRef = useRef();

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (graphWrapperRef.current) {
        const { width, height } = graphWrapperRef.current.getBoundingClientRect();
        dimensionsRef.current = { width, height };
        setDimensions({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (graphWrapperRef.current) observer.observe(graphWrapperRef.current);
    return () => { window.removeEventListener('resize', handleResize); observer.disconnect(); };
  }, []);

  // D3 physics tuning after graph loads
  useEffect(() => {
    if (fgRef.current && graph.nodes.length > 0) {
      fgRef.current.d3Force('charge').strength(-2000);
      fgRef.current.d3Force('link').distance(link => link.type === 'membership' ? 180 : 100);
      fgRef.current.d3Force('center').strength(0.2);
      setTimeout(() => fgRef.current?.zoomToFit(400, 50), 800);
    }
  }, [graph.nodes.length]);

  const init = useCallback(async () => {
    setLoading(true);
    reset();
    try {
      const res = await axios.get(`${API}/init`);
      if (res.data) {
        setGraph(res.data.graph || { nodes: [], links: [] });
        setLogs(res.data.logs || []);
        setStats(res.data.stats || {});
        setRound(0);
        setMlEnabled(res.data.ml_enabled || false);
      }
    } catch (e) {
      console.error('Backend offline.', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  // Use refs for values needed inside async callbacks to avoid stale closures
  const trackedNodeRef = useRef(trackedNode);
  const showCCPLedgerRef = useRef(showCCPLedger);
  useEffect(() => { trackedNodeRef.current = trackedNode; }, [trackedNode]);
  useEffect(() => { showCCPLedgerRef.current = showCCPLedger; }, [showCCPLedger]);

  const isHaltedRef = useRef(false);
  useEffect(() => { isHaltedRef.current = stats?.stability?.circuit_status === 'HALTED'; }, [stats]);

  const nextStep = useCallback(async () => {
    if (isHaltedRef.current) return;
    try {
      const res = await axios.post(`${API}/step`, { panic_level: panic });
      if (res.data) {
        setGraph(res.data.graph || { nodes: [], links: [] });
        const newLogs = Array.isArray(res.data.logs) ? res.data.logs : [];
        setLogs(prev => [...newLogs, ...(Array.isArray(prev) ? prev : [])].slice(0, 100));
        setStats(res.data.stats || {});
        setRound(res.data.round || 0);
        // Use ref to get current tracked node — avoids stale closure
        const curr = trackedNodeRef.current;
        if (curr) {
          const updated = (res.data.graph?.nodes || []).find(n => n.id === curr.id);
          if (updated) setTrackedNode(updated);
          fetchHistory(curr.id);
        }
        if (showCCPLedgerRef.current) fetchCCPData();
      }
    } catch (e) {
      console.error('Step failed:', e);
    }
  }, [panic]);

  const fetchHistory = async (nodeId) => {
    try {
      const res = await axios.get(`${API}/track/${nodeId}`);
      setTrackHistory(res.data.history || []);
    } catch (e) {}
  };

  const fetchCCPData = async () => {
    try {
      const res = await axios.get(`${API}/ccp/ledger`);
      setCcpData(res.data);
    } catch (e) {}
  };

  const handleNodeClick = useCallback((node) => {
    if (!node) return;
    if (node.is_ccp) {
      setShowCCPLedger(true);
      fetchCCPData();
      setTrackedNode(null);
    } else {
      setTrackedNode(node);
      fetchHistory(node.id);
      setShowCCPLedger(false);
    }
  }, []);

  const isHalted = stats?.stability?.circuit_status === 'HALTED';

  return (
    <ErrorBoundary>
    <div className="sim-root">
      {showResults && (
        <ResultsPage
          graph={graph}
          stats={stats}
          round={round}
          onClose={() => setShowResults(false)}
        />
      )}

      {/* HEADER */}
      <header className="sim-header">
        <div className="sim-header-brand">
          <div className="sim-brand-icon"><Cpu size={18} color="#06b6d4" /></div>
          <div>
            <h1 className="sim-brand-name">
              RESILINET <span className="sim-brand-badge">CORE-ML</span>
            </h1>
          </div>
        </div>

        <div className={`sim-market-status ${isHalted ? 'sim-market-status--halted' : ''}`}>
          {isHalted
            ? <><Lock size={13} className="sim-halted-icon" /><span className="sim-halted-text">TRADING HALTED</span></>
            : <><Unlock size={13} className="sim-open-icon" /><span className="sim-open-text">MARKET OPEN</span></>
          }
        </div>

        <div className="sim-header-controls">
          {/* ML Status */}
          {mlEnabled && (
            <div className="sim-ml-pill">
              <Radio size={10} color="#10b981" />
              <span>GATv2 Active</span>
            </div>
          )}

          {/* Panic Slider */}
          <div className="sim-panic-control">
            <span className="sim-panic-label">
              MARKET PANIC <span className="sim-panic-val">{(panic * 100).toFixed(0)}%</span>
            </span>
            <div className="sim-panic-track">
              <div
                className="sim-panic-fill"
                style={{ width: `${panic * 100}%` }}
              />
              <input
                type="range" min="0" max="1" step="0.1" value={panic}
                onChange={e => setPanic(Number(e.target.value))}
                className="sim-panic-input"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="sim-btn-row">
            <button
              onClick={nextStep}
              disabled={isHalted}
              className={`sim-btn sim-btn--execute ${isHalted ? 'sim-btn--disabled' : ''}`}
            >
              <Play size={13} /> EXECUTE
            </button>
            <button
              onClick={() => setShowResults(true)}
              className="sim-btn sim-btn--results"
            >
              <BarChart3 size={13} /> RESULTS
            </button>
            <button onClick={init} className="sim-btn-reset" title="Reset simulation">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="sim-body">
        {/* LEFT SIDEBAR — Node List */}
        <NodeSidebar
          nodes={graph.nodes}
          trackedNode={trackedNode}
          onNodeClick={handleNodeClick}
        />

        {/* GRAPH CANVAS */}
        <div ref={graphWrapperRef} className="sim-graph-area">
          {loading ? (
            <BootLoader />
          ) : graph.nodes.length > 0 ? (
            <ForceGraph2D
              ref={fgRef}
              graphData={graph}
              backgroundColor="#020408"
              width={dimensions.width}
              height={dimensions.height}
              enableZoom={true}
              enablePan={true}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const isHov = hoveredNode?.id === node.id;
                const isTrk = trackedNode?.id === node.id;
                const r = node.is_ccp ? 12 : 6;
                const color = node.color;

                if (isHov || isTrk) {
                  ctx.shadowColor = color;
                  ctx.shadowBlur = 30;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r * 2.2, 0, 2 * Math.PI);
                  ctx.strokeStyle = color;
                  ctx.lineWidth = 1.5;
                  ctx.stroke();
                }

                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();

                if (node.is_ccp) {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r * 0.55, 0, 2 * Math.PI);
                  ctx.fillStyle = '#fff';
                  ctx.fill();
                }

                if (isHov || node.is_ccp || isTrk) {
                  const label = node.is_ccp ? 'CCP PRIME' : node.name;
                  ctx.font = `bold ${12 / globalScale}px monospace`;
                  ctx.shadowBlur = 0;
                  ctx.fillStyle = '#fff';
                  ctx.textAlign = 'center';
                  ctx.fillText(label, node.x, node.y - r - 6 / globalScale);
                }
              }}
              linkCanvasObject={(link, ctx) => {
                const isConn = (hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id)) ||
                  (trackedNode && (link.source.id === trackedNode.id || link.target.id === trackedNode.id));
                const isMember = link.type === 'membership';
                const isRisk = link.color === '#ef4444';

                if (isMember && !isConn) return;

                ctx.beginPath();
                ctx.moveTo(link.source.x, link.source.y);
                ctx.lineTo(link.target.x, link.target.y);

                if (isConn) {
                  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
                } else if (isRisk) {
                  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
                } else {
                  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
                }
                ctx.stroke();
              }}
              onNodeClick={handleNodeClick}
              onNodeHover={node => setHoveredNode(node || null)}
              onLinkHover={link => setHoveredLink(link || null)}
            />
          ) : (
            <div className="sim-graph-empty">
              <Activity size={40} className="sim-empty-icon" />
              <div className="sim-empty-text">INITIALIZING NEURAL LATTICE...</div>
            </div>
          )}

          {/* Fit button */}
          <button
            onClick={() => fgRef.current?.zoomToFit(400, 50)}
            className="sim-fit-btn"
            title="Auto-fit graph"
          >
            <Maximize size={18} />
          </button>

          {/* Top-left metrics */}
          <div className="sim-overlay-tl">
            <MetricCard label="SIMULATION TIME" value={`T-${String(round).padStart(4, '0')}`} />
            <div className="sim-metric-row">
              <MetricCard label="ACTIVE" value={stats.active} color="var(--c-cyan)" />
              <MetricCard label="FAILURES" value={stats.defaulted} color="var(--c-red)" />
            </div>
          </div>

          {/* Stability Matrix — bottom right */}
          <StabilityMatrix stats={stats} />

          {/* Link Hover Tooltip */}
          <LinkTooltip link={hoveredLink} trackedNode={trackedNode} />

          {/* Neural Trace Panel */}
          {trackedNode && (
            <NeuralTrace
              node={trackedNode}
              history={trackHistory}
              onClose={() => setTrackedNode(null)}
            />
          )}

          {/* CCP Ledger Modal */}
          {showCCPLedger && (
            <CCPLedger
              ccpData={ccpData}
              stats={stats}
              onClose={() => setShowCCPLedger(false)}
              onRefresh={fetchCCPData}
            />
          )}

          {/* System Logs */}
          <LogsPanel logs={logs} />
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

// ================================================================
// MEMOIZED COMPONENTS — Prevent unnecessary re-renders
// ================================================================

const NodeSidebar = memo(({ nodes, trackedNode, onNodeClick }) => (
  <div className="sim-sidebar">
    <div className="sim-sidebar-header">
      <List size={12} /> NETWORK NODES
    </div>
    <div className="sim-sidebar-list">
      {nodes.filter(n => !n.is_ccp).map(n => (
        <div
          key={n.id}
          onClick={() => onNodeClick(n)}
          className={`sim-sidebar-item ${trackedNode?.id === n.id ? 'sim-sidebar-item--active' : ''}`}
        >
          <span className="sim-sidebar-name">{n.name}</span>
          <div
            className="sim-sidebar-dot"
            style={{ background: n.color }}
          />
        </div>
      ))}
    </div>
  </div>
));

const LogsPanel = memo(({ logs }) => {
  const safeLogs = Array.isArray(logs) ? logs : [];
  return (
  <div className="sim-logs-panel">
    <div className="sim-logs-header">
      <Activity size={10} /> SYSTEM LOGS
    </div>
    <div className="sim-logs-list">
      {safeLogs.map((l, i) => (
        <div key={i} className={`sim-log-entry ${l.includes('SHOCK') ? 'sim-log--warn' : l.includes('DEFAULT') ? 'sim-log--error' : l.includes('HALTED') ? 'sim-log--halted' : ''}`}>
          <span className="sim-log-time">[{new Date().toLocaleTimeString()}]</span>
          <span>{l}</span>
        </div>
      ))}
    </div>
  </div>
  );
});

const StabilityMatrix = memo(({ stats }) => {
  const [showInfo, setShowInfo] = React.useState(false);
  const s = stats?.stability || {};
  const payoff = s.ccp_payoff || 0;
  const penalty = s.ccp_penalty || 0;
  const butterfly = s.butterfly_risk || 0;
  const entropy = s.system_entropy || 0;
  const status = s.status || 'ANALYZING';
  const payoffPct = Math.min(100, (payoff / 10000000) * 100);

  return (
    <div className="sim-stability">
      <div className="sim-stability-header">
          <div className="sim-stability-title"><Anchor size={13} /> STABILITY MATRIX</div>
          <div className="sim-stability-actions">
            <span className={`sim-status-badge ${status === 'STABLE' ? 'sim-status-badge--stable' : 'sim-status-badge--danger'}`}>
              {status}
            </span>
          <button onClick={() => setShowInfo(v => !v)} className="sim-info-btn">
            <Info size={13} />
          </button>
        </div>
      </div>

      {showInfo ? (
        <div className="sim-stability-info">
          <p className="sim-info-item sim-info-item--green">
            <strong>System Payoff</strong> Total wealth generated by cleared transactions.
          </p>
          <p className="sim-info-item sim-info-item--red">
            <strong>Circuit Breaker</strong> Halts trading if failures exceed 30%.
          </p>
          <p className="sim-info-item sim-info-item--yellow">
            <strong>Butterfly Index</strong> Measures risk acceleration through Nash + hub concentration.
          </p>
          <button onClick={() => setShowInfo(false)} className="sim-info-close">RETURN</button>
        </div>
      ) : (
        <div className="sim-stability-body">
          <div className="sim-payoff-row">
            <span className="sim-payoff-label">SYSTEM PAYOFF</span>
            <span className="sim-payoff-value">₹{payoff.toLocaleString()}</span>
          </div>
          <div className="sim-payoff-bar">
            <div style={{ width: `${payoffPct}%` }} />
          </div>
          <div className="sim-stability-metrics">
            <div className="sim-metric-box">
              <div className="sim-metric-box-label"><Wind size={10} /> BUTTERFLY IDX</div>
              <div className={`sim-metric-box-val ${butterfly > 10 ? 'text-red' : ''}`}>
                {butterfly}%
              </div>
            </div>
            <div className="sim-metric-box">
              <div className="sim-metric-box-label"><TrendingUp size={10} /> ENTROPY</div>
              <div className="sim-metric-box-val">{entropy}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const NeuralTrace = memo(({ node, history, onClose }) => (
  <div className="sim-trace">
    <div className="sim-trace-header">
      <span className="sim-trace-title"><TrendingUp size={14} /> NEURAL TRACE</span>
      <button onClick={onClose} className="sim-trace-close">[CLOSE]</button>
    </div>
    <div className="sim-trace-body">
      <div className="sim-trace-entity">
        <div>
          <div className="sim-trace-entity-label">TARGET ENTITY</div>
          <div className="sim-trace-entity-name">{node.name}</div>
        </div>
        <span
          className="sim-trace-risk-badge"
          style={{
            background: node.color === '#ef4444' ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)',
            color: node.color === '#ef4444' ? '#ef4444' : '#06b6d4',
            border: `1px solid ${node.color === '#ef4444' ? '#ef444450' : '#06b6d450'}`,
          }}
        >
          {node.risk_label}
        </span>
      </div>

      {/* Sensitivity */}
      <div className={`sim-trace-row ${node.sensitivity > 0.8 ? 'sim-trace-row--danger' : ''}`}>
        <div className="sim-trace-row-left">
          <Bomb size={13} className={node.sensitivity > 0.8 ? 'text-red anim-pulse' : 'text-gray'} />
          <span>SENSITIVITY (BOMB)</span>
        </div>
        <span className="sim-trace-row-val">{node.sensitivity} / 1.0</span>
      </div>

      {/* PnL */}
      <div className="sim-trace-row">
        <span>NET PROFIT (PnL)</span>
        <span className={node.profit >= 0 ? 'text-green' : 'text-red'}>
          {node.profit >= 0 ? '+' : ''}₹{(node.profit || 0).toLocaleString()}
        </span>
      </div>

      {/* Nash */}
      <div className="sim-trace-row">
        <span>NASH STRATEGY</span>
        <div className="sim-trace-nash">
          {node.nash_action === 'RISK_ON' && <Sword size={12} className="text-cyan" />}
          {node.nash_action === 'RISK_OFF' && <Shield size={12} className="text-yellow" />}
          <span>{node.nash_action || 'HOLD'}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="sim-trace-chart">
        {history.length < 2 ? (
          <div className="sim-trace-chart-empty">
            <Radio size={20} className="anim-pulse" color="#06b6d430" />
            <span>Select a node to initiate telemetry</span>
          </div>
        ) : (
          <InteractiveChart data={history} color={node.color} />
        )}
      </div>

      {/* Bottom stats */}
      <div className="sim-trace-stats">
        <div className="sim-trace-stat sim-trace-stat--cyan">
          <span className="sim-trace-stat-label">HEALTH</span>
          <span className="sim-trace-stat-val">{node.health}</span>
        </div>
        <div className="sim-trace-stat sim-trace-stat--red">
          <span className="sim-trace-stat-label">AI PROB</span>
          <span className="sim-trace-stat-val">{(node.ml_risk_prob * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  </div>
));

const CCPLedger = memo(({ ccpData, stats, onClose }) => (
  <div className="sim-ledger-overlay">
    <div className="sim-ledger">
      <div className="sim-ledger-topbar" />
      <div className="sim-ledger-header">
        <div className="sim-ledger-title-row">
          <div className="sim-ledger-icon"><Database size={22} /></div>
          <div>
            <h2 className="sim-ledger-title">
              CCP_PRIME <span className="sim-ledger-live">LIVE LEDGER</span>
            </h2>
            <div className="sim-ledger-sub">CENTRAL CLEARING PAYOFF TRACKER // ENCRYPTED</div>
          </div>
        </div>
        <div className="sim-ledger-totals">
          <div className="sim-ledger-total">
            <div className="sim-ledger-total-label"><Wallet size={10} /> PENALTY WALLET</div>
            <div className="sim-ledger-total-val sim-ledger-total-val--red">
              ₹{(stats.stability?.ccp_penalty || 0).toLocaleString()}
            </div>
          </div>
          <div className="sim-ledger-total">
            <div className="sim-ledger-total-label">TOTAL PAYOFF</div>
            <div className="sim-ledger-total-val sim-ledger-total-val--green">
              ₹{(ccpData.total_volume || 0).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} className="sim-ledger-close"><X size={22} /></button>
        </div>
      </div>
      <div className="sim-ledger-body">
        <table className="sim-ledger-table">
          <thead>
            <tr>
              {['TX_HASH', 'TIME', 'SOURCE', 'TARGET', 'TYPE', 'AMOUNT', 'STATUS'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(ccpData.transactions || []).map((tx, i) => (
              <tr key={i}>
                <td className="sim-ledger-hash">{tx.id}</td>
                <td>{tx.time}</td>
                <td className="sim-ledger-bank">{tx.source}</td>
                <td className="sim-ledger-bank">{tx.target}</td>
                <td className="sim-ledger-type">{tx.type}</td>
                <td className="sim-ledger-amount">₹{(tx.amount || 0).toLocaleString()}</td>
                <td>
                  <span className={`sim-ledger-status ${
                    tx.status === 'CLEARED' ? 'sim-ledger-status--cleared'
                    : tx.status?.includes('REJECTED') ? 'sim-ledger-status--rejected'
                    : 'sim-ledger-status--failed'
                  }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
));

const LinkTooltip = memo(({ link, trackedNode }) => {
  if (!link || trackedNode || !link.type || link.type === 'membership') return null;
  return (
    <div className="sim-link-tooltip">
      <div className="sim-link-tooltip-header">
        <Wifi size={13} className={link.stress === 'Contagion Risk' ? 'text-red' : 'text-green'} />
        <span>{link.stress}</span>
      </div>
      <div className="sim-link-tooltip-row"><span>FROM</span><span className="text-cyan">{link.source?.id}</span></div>
      <div className="sim-link-tooltip-row"><span>TO</span><span className="text-cyan">{link.target?.id}</span></div>
      <div className="sim-link-tooltip-row"><span>VOL</span><span>₹{(link.amount || 0).toLocaleString()}</span></div>
    </div>
  );
});

// ================================================================
// BOOT LOADER — cinematic terminal boot sequence
// ================================================================
const BootLoader = () => {
  const [lines, setLines] = React.useState([]);
  const bootLines = [
    '> INITIALIZING RESILINET CORE-ML ENGINE...',
    '> LOADING NETWORK TOPOLOGY...',
    '> BUILDING INTERBANK GRAPH (NetworkX)...',
    '> CALIBRATING EIGENVECTOR CENTRALITY...',
    '> ACTIVATING NASH EQUILIBRIUM MODULE...',
    '> GATv2 ATTENTION HEADS: ONLINE...',
    '> CCP CLEARING SYSTEM: ARMED...',
    '> NEURAL LATTICE READY.',
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sim-bootloader">
      <Terminal size={36} color="#06b6d4" className="sim-boot-icon" />
      <div className="sim-boot-lines">
        {lines.map((l, i) => (
          <div key={i} className="sim-boot-line" style={{ animationDelay: `${i * 0.05}s` }}>
            {l}
          </div>
        ))}
        <div className="sim-boot-cursor">▌</div>
      </div>
    </div>
  );
};

// ================================================================
// INTERACTIVE CHART — fixed cursor.x bug
// ================================================================
const InteractiveChart = ({ data, color }) => {
  const svgRef = useRef(null);
  const [cursor, setCursor] = React.useState(null);
  const W = 340; const H = 120; const PAD = 5;
  const risks = data.map(d => d.risk);

  const getXY = (val, i) => {
    const x = risks.length > 1 ? (i / (risks.length - 1)) * (W - PAD * 2) + PAD : W / 2;
    const y = H - ((val - 0) / (100 - 0)) * (H - PAD * 2) - PAD;
    return { x, y };
  };

  const points = risks.map((val, i) => { const p = getXY(val, i); return `${p.x},${p.y}`; }).join(' ');

  let ghostPath = '';
  if (risks.length >= 2) {
    const last = risks[risks.length - 1];
    const slope = last - risks[risks.length - 2];
    const nextVal = Math.min(100, Math.max(0, last + slope));
    const { x: lx, y: ly } = getXY(last, risks.length - 1);
    const nx = W; const ny = H - ((nextVal / 100) * (H - PAD * 2)) - PAD;
    ghostPath = `M${lx},${ly} L${nx},${ny}`;
  }

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const index = Math.round(((mouseX - PAD) / (W - PAD * 2)) * (risks.length - 1));
    const safeIndex = Math.max(0, Math.min(index, risks.length - 1));
    const { x: cx } = getXY(risks[safeIndex], safeIndex);
    setCursor({ svgX: cx, safeIndex, value: risks[safeIndex], round: data[safeIndex].round });
  };

  return (
    <div className="chart-wrap" onMouseMove={handleMouseMove} onMouseLeave={() => setCursor(null)}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M${PAD},${H} ${points} L${W - PAD},${H}`} fill="url(#cg)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {ghostPath && <path d={ghostPath} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />}
        {cursor && (
          <>
            <line x1={cursor.svgX} y1="0" x2={cursor.svgX} y2={H} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" />
            <circle
              cx={cursor.svgX}
              cy={H - ((cursor.value / 100) * (H - PAD * 2)) - PAD}
              r="4" fill="#fff" stroke={color} strokeWidth="2"
            />
          </>
        )}
      </svg>
      {cursor && (
        <div
          className="chart-tooltip"
          style={{ left: `${(cursor.svgX / W) * 100}%` }}
        >
          <div className="chart-tooltip-round">ROUND {cursor.round}</div>
          <div className="chart-tooltip-val" style={{ color }}>{cursor.value.toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, color = '#fff' }) => (
  <div className="sim-metric-card">
    <div className="sim-metric-label">{label}</div>
    <div className="sim-metric-value" style={{ color }}>{value}</div>
  </div>
);