import React, { useState, useEffect } from 'react';
import { Activity, Shield, Zap, GitBranch, ChevronRight, Cpu, TrendingUp, AlertTriangle, Network } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const features = [
  {
    icon: Network,
    accent: '#06b6d4',
    title: 'GATv2 Neural Risk Engine',
    description: 'Graph Attention Networks dynamically weigh neighbor risk, predicting contagion 1–2 rounds before traditional Basel III metrics detect it.'
  },
  {
    icon: GitBranch,
    accent: '#d946ef',
    title: 'Nash Equilibrium Stabilizer',
    description: 'Banks autonomously shift between RISK_ON and RISK_OFF strategies based on neighborhood health, converging toward macro-level equilibria.'
  },
  {
    icon: Shield,
    accent: '#4F46E5',
    title: 'CCP Circuit Breaker',
    description: 'Eigenvector centrality identifies Super Spreaders. If a high-risk node attempts a large transaction, the CCP intercepts, rejects, and fines it.'
  },
  {
    icon: TrendingUp,
    accent: '#eab308',
    title: 'Hidden Bomb Detection',
    description: 'Differential sensitivity analysis calculates d(Risk)/d(Lending)—identifying banks that look safe but will explode under minor shocks.'
  },
  {
    icon: AlertTriangle,
    accent: '#ef4444',
    title: 'Contagion Propagation',
    description: 'Real-time simulation of how localized shocks cascade through interbank lending networks, triggering systemic collapse via domino defaults.'
  },
  {
    icon: Zap,
    accent: '#10b981',
    title: 'Live Market Telemetry',
    description: 'Per-node Neural Trace panels display ML risk probabilities, PnL history, and risk velocity slopes with an interactive chart cursor.'
  }
];

const techStack = [
  { name: 'React + Vite', color: '#61DAFB', role: 'Frontend UI' },
  { name: 'Flask + Python', color: '#38B2AC', role: 'Backend API' },
  { name: 'NetworkX', color: '#4F46E5', role: 'Graph Engine' },
  { name: 'PyTorch GATv2', color: '#EE4C2C', role: 'ML Core' },
  { name: 'react-force-graph', color: '#06b6d4', role: 'Visualization' },
  { name: 'Zustand', color: '#f59e0b', role: 'State Management' },
  { name: 'Render', color: '#10b981', role: 'Backend Deployment' },
  { name: 'Vercel', color: '#fff', role: 'Frontend Edge' },
];

export default function LandingPage({ onLaunch }) {
  const [backendStatus, setBackendStatus] = useState('checking'); // checking | online | offline
  const [mlEnabled, setMlEnabled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/health`);
        if (res.ok) {
          const data = await res.json();
          setBackendStatus('online');
          setMlEnabled(data.ml_enabled || false);
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div className="landing-root" style={{
      background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(79,70,229,0.08) 0%, transparent 60%), #000`
    }}>
      {/* Animated grid background */}
      <div className="landing-grid-bg" />

      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <Cpu size={18} color="#06b6d4" />
            </div>
            <span className="landing-logo-text">RESILINET</span>
            <span className="landing-badge">CORE-ML</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#tech">Tech Stack</a>
          </div>
          <StatusPill status={backendStatus} />
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-content">
          <div className="landing-eyebrow">
            <span className="landing-eyebrow-dot" />
            AI-Driven Systemic Risk Simulator
          </div>
          <h1 className="landing-h1">
            Prevent the next<br />
            <span className="landing-h1-gradient">financial crash.</span>
          </h1>
          <p className="landing-subtext">
            ResiliNet models how localized bank failures cascade into systemic collapse through interbank lending networks—combining Graph Attention Networks, Nash Equilibrium Game Theory, and real-time circuit breakers.
          </p>
          <div className="landing-cta-row">
            <button
              className={`landing-cta-btn ${backendStatus !== 'online' ? 'landing-cta-btn--disabled' : ''}`}
              onClick={() => backendStatus === 'online' && onLaunch()}
              disabled={backendStatus !== 'online'}
            >
              {backendStatus === 'checking' ? (
                <><span className="landing-spinner" /> Connecting to Engine...</>
              ) : backendStatus === 'offline' ? (
                <>⚠️ Backend Offline — Start Flask server</>
              ) : (
                <>Launch Simulator <ChevronRight size={18} /></>
              )}
            </button>
            {mlEnabled && (
              <span className="landing-ml-badge">
                <Activity size={12} /> GATv2 ML Active
              </span>
            )}
          </div>
          {backendStatus === 'offline' && (
            <p className="landing-offline-hint">
              Run: <code>cd backend && pip install -r requirements.txt && python server.py</code>
            </p>
          )}
        </div>

        {/* Animated Network Globe */}
        <div className="landing-hero-visual">
          <NetworkGlobe />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="landing-section">
        <div className="landing-section-label">CORE-ML ENGINE</div>
        <h2 className="landing-section-title">What makes this different</h2>
        <p className="landing-section-sub">
          Not a static graph. Not a simple formula. A live, self-learning system that predicts cascades before they happen.
        </p>
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-section-label">SIMULATION FLOW</div>
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          {[
            { step: '01', title: 'Load Network', desc: 'Import real interbank lending data into a NetworkX directed graph. Each node is a bank with assets, capital ratio, and strategy.' },
            { step: '02', title: 'Apply Shock', desc: 'Inject a panic event — market shock damages a random bank\'s capital buffer based on panic intensity.' },
            { step: '03', title: 'Propagate Risk', desc: 'GATv2 attention mechanism identifies which lending relationships are toxic. Risk cascades through contagion paths.' },
            { step: '04', title: 'Nash Equilibrium', desc: 'Each bank evaluates neighbors — switching to RISK_OFF (hoarding) or RISK_ON (investing). System converges toward equilibrium.' },
            { step: '05', title: 'CCP Intervention', desc: 'Central Counterparty intercepts high-risk transactions from Super Spreaders. Fines collected in the Penalty Wallet.' },
            { step: '06', title: 'Circuit Breaker', desc: 'If defaults exceed 30%, the market halts automatically. Full simulation snapshot available in the Results dashboard.' },
          ].map((s, i) => (
            <div key={i} className="landing-step">
              <div className="landing-step-num">{s.step}</div>
              <div>
                <div className="landing-step-title">{s.title}</div>
                <div className="landing-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section id="tech" className="landing-section">
        <div className="landing-section-label">TECH STACK</div>
        <h2 className="landing-section-title">Built with precision</h2>
        <div className="landing-tech-grid">
          {techStack.map((t, i) => (
            <div key={i} className="landing-tech-card">
              <div className="landing-tech-dot" style={{ background: t.color }} />
              <div className="landing-tech-name">{t.name}</div>
              <div className="landing-tech-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="landing-footer-cta">
        <h2 className="landing-footer-title">Ready to stress-test the system?</h2>
        <button
          className={`landing-cta-btn ${backendStatus !== 'online' ? 'landing-cta-btn--disabled' : ''}`}
          onClick={() => backendStatus === 'online' && onLaunch()}
          disabled={backendStatus !== 'online'}
        >
          {backendStatus === 'online' ? <>Launch Simulator <ChevronRight size={18} /></> : backendStatus === 'offline' ? '⚠️ Backend Offline' : 'Connecting...'}
        </button>
      </section>

      <footer className="landing-footer">
        <span>ResiliNet · CORE-ML Engine · Built for Datathon PS-2</span>
      </footer>
    </div>
  );
}

const StatusPill = ({ status }) => {
  const map = {
    checking: { color: '#eab308', label: 'Connecting...' },
    online: { color: '#10b981', label: 'Backend Online' },
    offline: { color: '#ef4444', label: 'Backend Offline' },
  };
  const { color, label } = map[status];
  return (
    <div className="landing-status-pill" style={{ borderColor: `${color}40` }}>
      <span className="landing-status-dot" style={{ background: color }} />
      <span style={{ color, fontSize: '11px', fontWeight: 600 }}>{label}</span>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, accent, title, description }) => (
  <div className="landing-feature-card" style={{ '--accent': accent }}>
    <div className="landing-feature-icon" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
      <Icon size={20} color={accent} />
    </div>
    <h3 className="landing-feature-title">{title}</h3>
    <p className="landing-feature-desc">{description}</p>
  </div>
);

// Animated SVG network visualization
const NetworkGlobe = () => {
  const nodes = [
    { cx: 200, cy: 100 }, { cx: 320, cy: 80 }, { cx: 380, cy: 180 },
    { cx: 300, cy: 260 }, { cx: 160, cy: 220 }, { cx: 100, cy: 160 },
    { cx: 240, cy: 180 }, { cx: 420, cy: 100 }, { cx: 80, cy: 80 },
  ];
  const links = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
    [0, 6], [1, 6], [2, 6], [3, 6], [7, 1], [7, 2], [8, 0], [8, 5],
  ];
  const colors = ['#06b6d4', '#4F46E5', '#d946ef', '#eab308', '#ef4444', '#10b981'];

  return (
    <svg viewBox="0 0 500 340" className="landing-network-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke={i % 3 === 0 ? '#ef444430' : '#ffffff10'}
          strokeWidth={i % 3 === 0 ? 1.5 : 1}
        />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={i === 6 ? 24 : 14} fill={`${colors[i % colors.length]}20`} stroke={colors[i % colors.length]} strokeWidth="1" filter="url(#glow)" className="network-node-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
          <circle cx={n.cx} cy={n.cy} r={i === 6 ? 6 : 4} fill={colors[i % colors.length]} />
        </g>
      ))}
    </svg>
  );
};
