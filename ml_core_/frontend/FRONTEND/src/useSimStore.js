import { create } from 'zustand';

const useSimStore = create((set, get) => ({
  // Simulation state
  graph: { nodes: [], links: [] },
  logs: [],
  stats: {
    active: 0,
    defaulted: 0,
    stability: {
      nash_convergence: 100,
      butterfly_risk: 0,
      system_entropy: 0,
      status: 'STABLE',
      ccp_payoff: 0,
      ccp_penalty: 0,
      circuit_status: 'OPEN',
    },
  },
  round: 0,
  panic: 0.2,
  loading: false,
  mlEnabled: false,

  // UI state
  trackedNode: null,
  trackHistory: [],
  hoveredNode: null,
  hoveredLink: null,
  showCCPLedger: false,
  showResults: false,
  ccpData: { transactions: [], total_volume: 0, total_penalty: 0, cleared_count: 0 },

  // Actions
  setPanic: (v) => set({ panic: v }),
  setHoveredNode: (n) => set({ hoveredNode: n }),
  setHoveredLink: (l) => set({ hoveredLink: l }),
  setShowResults: (v) => set({ showResults: v }),

  setGraph: (graph) => set({ graph }),
  setLogs: (logs) => set({ logs }),
  setStats: (stats) => set({ stats }),
  setRound: (round) => set({ round }),
  setLoading: (loading) => set({ loading }),
  setMlEnabled: (mlEnabled) => set({ mlEnabled }),

  setTrackedNode: (node) => set({ trackedNode: node }),
  setTrackHistory: (history) => set({ trackHistory: history }),
  setShowCCPLedger: (v) => set({ showCCPLedger: v }),
  setCcpData: (data) => set({ ccpData: data }),

  reset: () => set({
    graph: { nodes: [], links: [] },
    logs: [],
    round: 0,
    trackedNode: null,
    trackHistory: [],
    showCCPLedger: false,
    ccpData: { transactions: [], total_volume: 0, total_penalty: 0, cleared_count: 0 },
    stats: {
      active: 0, defaulted: 0,
      stability: {
        nash_convergence: 100, butterfly_risk: 0, system_entropy: 0,
        status: 'STABLE', ccp_payoff: 0, ccp_penalty: 0, circuit_status: 'OPEN',
      },
    },
  }),
}));

export default useSimStore;
