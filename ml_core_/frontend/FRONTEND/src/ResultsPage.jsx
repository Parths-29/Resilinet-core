import React, { useState } from 'react';
import {
  X, Users, AlertOctagon, TrendingDown, Activity,
  Shield, Zap, BarChart3, Brain, GitBranch, DollarSign
} from 'lucide-react';

const ResultsPage = ({ graph, stats, round, onClose }) => {
  const nodes = graph?.nodes || [];
  const links = graph?.links || [];
  const stability = stats?.stability || {};

  // ── Data derivation ──────────────────────────────────────────
  const bankNodes = nodes.filter(n => !n.is_ccp);

  const bankStats = {
    safe:      bankNodes.filter(n => n.risk_label === 'SAFE').length,
    undercap:  bankNodes.filter(n => n.risk_label === 'UNDER-CAPITALIZED').length,
    insolvent: bankNodes.filter(n => n.risk_label === 'INSOLVENT').length,
    total:     bankNodes.length,
  };

  const riskDist = {
    low:      bankNodes.filter(n => n.ml_risk_prob < 0.2).length,
    medium:   bankNodes.filter(n => n.ml_risk_prob >= 0.2 && n.ml_risk_prob < 0.5).length,
    high:     bankNodes.filter(n => n.ml_risk_prob >= 0.5 && n.ml_risk_prob < 0.8).length,
    critical: bankNodes.filter(n => n.ml_risk_prob >= 0.8).length,
  };

  const totalAssets = bankNodes.reduce((s, n) => s + (n.actual_assets || 0), 0);
  const totalProfit = bankNodes.reduce((s, n) => s + (n.profit || 0), 0);
  const avgHealth = bankStats.total > 0
    ? (bankNodes.reduce((s, n) => s + (n.health || 0), 0) / bankStats.total).toFixed(1)
    : '0.0';

  const contagionLinks = links.filter(l => l.stress === 'Contagion Risk' && l.type !== 'membership').length;
  const totalLinks = links.filter(l => l.type === 'transaction').length;

  const sortedBanks = [...bankNodes].sort((a, b) => (b.ml_risk_prob || 0) - (a.ml_risk_prob || 0));

  return (
    <div className="res-overlay">
      {/* ── HEADER ── */}
      <div className="res-header">
        <div className="res-header-left">
          <div className="res-header-icon"><Activity size={18} color="#06b6d4" /></div>
          <div>
            <h1 className="res-title">SIMULATION RESULTS</h1>
            <p className="res-subtitle">Analysis after {round} simulation round{round !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={onClose} className="res-close-btn" title="Close">
          <X size={20} />
        </button>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="res-body">

        {/* ── SECTION 1: KEY METRICS ── */}
        <div className="res-section-label">OVERVIEW</div>
        <div className="res-kpi-grid">
          <KPICard
            icon={Users} label="Total Banks" value={bankStats.total}
            sub={`${bankStats.safe} Safe · ${bankStats.undercap} At Risk`}
            accent="#06b6d4"
          />
          <KPICard
            icon={AlertOctagon} label="Insolvent" value={bankStats.insolvent}
            sub={bankStats.total > 0 ? `${((bankStats.insolvent / bankStats.total) * 100).toFixed(1)}% failure rate` : '—'}
            accent="#ef4444"
          />
          <KPICard
            icon={TrendingDown} label="Contagion Links" value={contagionLinks}
            sub={`of ${totalLinks} lending links`}
            accent="#f97316"
          />
          <KPICard
            icon={Activity} label="Circuit Breaker"
            value={stability.circuit_status || 'OPEN'}
            sub={stability.circuit_status === 'HALTED' ? '⚠ Trading halted' : 'Market active'}
            accent={stability.circuit_status === 'HALTED' ? '#ef4444' : '#10b981'}
          />
        </div>

        {/* ── SECTION 2: FINANCIAL METRICS ── */}
        <div className="res-section-label" style={{ marginTop: 24 }}>FINANCIAL SNAPSHOT</div>
        <div className="res-fin-grid">
          <FinCard label="TOTAL ASSETS" value={`₹${(totalAssets / 1e6).toFixed(2)}M`} accent="#3b82f6" />
          <FinCard
            label="SYSTEM PROFIT"
            value={`${totalProfit >= 0 ? '+' : ''}₹${(totalProfit / 1e6).toFixed(2)}M`}
            accent={totalProfit >= 0 ? '#10b981' : '#ef4444'}
          />
          <FinCard label="AVG HEALTH" value={`${avgHealth}%`} accent="#06b6d4" />
          <FinCard label="SYSTEM PAYOFF" value={`₹${((stability.ccp_payoff || 0) / 1e6).toFixed(2)}M`} accent="#d946ef" />
        </div>

        {/* ── SECTION 3: CHARTS ── */}
        <div className="res-section-label" style={{ marginTop: 24 }}>NETWORK INTELLIGENCE LAYER</div>
        <div className="res-charts-grid">
          {/* Bank Status Donut */}
          <div className="res-chart-card">
            <div className="res-chart-card-header">
              <BarChart3 size={14} color="#06b6d4" />
              <span>Bank Status Distribution</span>
              <span className="res-chart-badge" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>Nash Equilibrium</span>
            </div>
            <div className="res-chart-body">
              <RingChart
                data={[
                  { label: 'Safe', value: bankStats.safe, color: '#06b6d4' },
                  { label: 'At Risk', value: bankStats.undercap, color: '#eab308' },
                  { label: 'Insolvent', value: bankStats.insolvent, color: '#ef4444' },
                ]}
                total={bankStats.total}
                centerText={`${bankStats.total}`}
                centerSub="banks"
              />
              <div className="res-legend">
                <LegendItem color="#06b6d4" label="Safe" count={bankStats.safe} />
                <LegendItem color="#eab308" label="Under-Cap" count={bankStats.undercap} />
                <LegendItem color="#ef4444" label="Insolvent" count={bankStats.insolvent} />
              </div>
            </div>
          </div>

          {/* ML Risk Donut */}
          <div className="res-chart-card">
            <div className="res-chart-card-header">
              <Brain size={14} color="#d946ef" />
              <span>GATv2 ML Risk Distribution</span>
              <span className="res-chart-badge" style={{ background: 'rgba(217,70,239,0.1)', color: '#d946ef', border: '1px solid rgba(217,70,239,0.3)' }}>AI Predictions</span>
            </div>
            <div className="res-chart-body">
              <RingChart
                data={[
                  { label: 'Low', value: riskDist.low, color: '#10b981' },
                  { label: 'Medium', value: riskDist.medium, color: '#f59e0b' },
                  { label: 'High', value: riskDist.high, color: '#f97316' },
                  { label: 'Critical', value: riskDist.critical, color: '#ef4444' },
                ]}
                total={bankStats.total}
                centerText={`${riskDist.low}`}
                centerSub="low risk"
              />
              <div className="res-legend">
                <LegendItem color="#10b981" label="Low" count={riskDist.low} />
                <LegendItem color="#f59e0b" label="Medium" count={riskDist.medium} />
                <LegendItem color="#f97316" label="High" count={riskDist.high} />
                <LegendItem color="#ef4444" label="Critical" count={riskDist.critical} />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: STABILITY METRICS ── */}
        <div className="res-section-label" style={{ marginTop: 24 }}>SYSTEMIC RISK METRICS</div>
        <div className="res-stability-grid">
          <StabilityBox
            label="BUTTERFLY RISK" value={`${stability.butterfly_risk || 0}%`}
            sub="Risk acceleration index"
            accent="#d946ef"
            warning={(stability.butterfly_risk || 0) > 10}
          />
          <StabilityBox
            label="SYSTEM ENTROPY" value={stability.system_entropy || 0}
            sub="Health distribution inequality"
            accent="#3b82f6"
          />
          <StabilityBox
            label="NASH CONVERGENCE" value={`${stability.nash_convergence || 100}%`}
            sub="Strategy equilibrium reached"
            accent="#10b981"
          />
          <StabilityBox
            label="SYSTEM STATUS" value={stability.status || 'STABLE'}
            sub={stability.status === 'STABLE' ? 'No systemic risk detected' : 'Elevated contagion risk'}
            accent={stability.status === 'STABLE' ? '#10b981' : '#ef4444'}
            warning={stability.status !== 'STABLE'}
          />
        </div>

        {/* ── SECTION 5: PER-BANK TABLE ── */}
        <div className="res-section-label" style={{ marginTop: 24 }}>PER-BANK RISK ATTRIBUTION</div>
        <div className="res-table-card">
          <table className="res-table">
            <thead>
              <tr>
                <th>BANK ID</th>
                <th className="text-center">HEALTH</th>
                <th className="text-center">ML RISK</th>
                <th className="text-center">STATUS</th>
                <th className="text-right">ASSETS</th>
                <th className="text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {sortedBanks.map((node, i) => (
                <tr key={i} className={node.risk_label !== 'SAFE' ? 'res-table-row--warn' : ''}>
                  <td className="res-table-bank">{node.name}</td>
                  <td className="text-center">
                    <HealthBar value={node.health || 0} />
                  </td>
                  <td className="text-center">
                    <span className={`res-risk-pct ${
                      (node.ml_risk_prob || 0) > 0.8 ? 'res-risk-pct--critical'
                      : (node.ml_risk_prob || 0) > 0.5 ? 'res-risk-pct--high'
                      : (node.ml_risk_prob || 0) > 0.2 ? 'res-risk-pct--med'
                      : 'res-risk-pct--low'
                    }`}>
                      {((node.ml_risk_prob || 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`res-status-tag ${
                      node.risk_label === 'SAFE' ? 'res-status-tag--safe'
                      : node.risk_label === 'UNDER-CAPITALIZED' ? 'res-status-tag--warn'
                      : 'res-status-tag--danger'
                    }`}>
                      {node.risk_label}
                    </span>
                  </td>
                  <td className="text-right res-table-num">
                    ₹{((node.actual_assets || 0) / 1e6).toFixed(1)}M
                  </td>
                  <td className="text-right res-table-num">
                    <span className={(node.profit || 0) >= 0 ? 'text-green' : 'text-red'}>
                      {(node.profit || 0) >= 0 ? '+' : ''}₹{(Math.abs(node.profit || 0) / 1e3).toFixed(0)}K
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── SECTION 6: USP FOOTER ── */}
        <div className="res-usp-footer">
          <div className="res-usp-title">What makes this different from Basel III, VaR &amp; static stress tests</div>
          <div className="res-usp-cards">
            <div className="res-usp-card">
              <GitBranch size={16} color="#06b6d4" />
              <div>
                <div className="res-usp-card-title">Game-Theoretic Decisions</div>
                <div className="res-usp-card-desc">Banks choose RISK_ON / RISK_OFF under incomplete information — not fixed rules. Nash equilibrium captures emergent macro behavior.</div>
              </div>
            </div>
            <div className="res-usp-card">
              <Zap size={16} color="#d946ef" />
              <div>
                <div className="res-usp-card-title">Velocity Detection (d(Health)/dt)</div>
                <div className="res-usp-card-desc">Butterfly Risk tracks how fast health is declining, not just its current value. A 5% drop per round is far more dangerous than a static 50%.</div>
              </div>
            </div>
            <div className="res-usp-card">
              <Brain size={16} color="#a855f7" />
              <div>
                <div className="res-usp-card-title">GATv2 Neural Contagion</div>
                <div className="res-usp-card-desc">Graph Attention Networks learn which peer connections are toxic from 50+ rounds of history — predicting failures 1–2 rounds before capital ratios breach thresholds.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────

const KPICard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="res-kpi-card" style={{ borderColor: `${accent}30` }}>
    <div className="res-kpi-header">
      <Icon size={13} color={accent} />
      <span className="res-kpi-label" style={{ color: accent }}>{label}</span>
    </div>
    <div className="res-kpi-value">{value}</div>
    <div className="res-kpi-sub">{sub}</div>
  </div>
);

const FinCard = ({ label, value, accent }) => (
  <div className="res-fin-card" style={{ borderLeftColor: accent }}>
    <div className="res-fin-label">{label}</div>
    <div className="res-fin-value" style={{ color: accent }}>{value}</div>
  </div>
);

const StabilityBox = ({ label, value, sub, accent, warning }) => (
  <div className={`res-stability-box ${warning ? 'res-stability-box--warn' : ''}`} style={{ borderColor: `${accent}30` }}>
    <div className="res-stability-label" style={{ color: accent }}>{label}</div>
    <div className={`res-stability-value ${warning ? 'anim-pulse' : ''}`} style={{ color: warning ? '#ef4444' : '#fff' }}>{value}</div>
    <div className="res-stability-sub">{sub}</div>
  </div>
);

const LegendItem = ({ color, label, count }) => (
  <div className="res-legend-item">
    <span className="res-legend-dot" style={{ background: color }} />
    <span className="res-legend-label">{label}</span>
    <span className="res-legend-count" style={{ color }}>{count}</span>
  </div>
);

const HealthBar = ({ value }) => (
  <div className="res-health-bar-wrap">
    <div
      className="res-health-bar-fill"
      style={{
        width: `${Math.min(100, value)}%`,
        background: value > 70 ? '#10b981' : value > 40 ? '#eab308' : '#ef4444',
      }}
    />
    <span className="res-health-val">{value}%</span>
  </div>
);

// ── Ring Chart (replaces broken DonutChart) ──────────────────
const RingChart = ({ data, total, centerText, centerSub }) => {
  const SIZE = 140;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 56;
  const R_INNER = 34;
  const STROKE = R_OUTER - R_INNER;
  const RADIUS = R_INNER + STROKE / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Use stroke-dasharray approach — works even when a slice is 100%
  const nonZero = data.filter(d => d.value > 0);
  const validTotal = nonZero.reduce((s, d) => s + d.value, 0);

  if (validTotal === 0) {
    // All zero: show a grey placeholder ring
    return (
      <svg width={SIZE} height={SIZE} className="flex-shrink-0">
        <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#1e293b" strokeWidth={STROKE} />
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#475569" fontSize="18" fontWeight="700" fontFamily="monospace">{centerText}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fill="#334155" fontSize="9" fontFamily="monospace">{centerSub}</text>
      </svg>
    );
  }

  // Build arc segments using stroke-dasharray
  let offset = 0;
  const segments = nonZero.map((d, i) => {
    const pct = d.value / validTotal;
    const dash = pct * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const seg = (
      <circle
        key={i}
        cx={CX} cy={CY}
        r={RADIUS}
        fill="none"
        stroke={d.color}
        strokeWidth={STROKE}
        strokeDasharray={`${dash - 1.5} ${gap + 1.5}`}
        strokeDashoffset={-(offset * CIRCUMFERENCE) + CIRCUMFERENCE / 4}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    );
    offset += pct;
    return seg;
  });

  return (
    <svg width={SIZE} height={SIZE} className="flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#0f172a" strokeWidth={STROKE} />
      {segments}
      {/* Center text — counter-rotate so it reads normally */}
      <g transform={`rotate(90, ${CX}, ${CY})`}>
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="900" fontFamily="monospace">{centerText}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">{centerSub}</text>
      </g>
    </svg>
  );
};

export default ResultsPage;
