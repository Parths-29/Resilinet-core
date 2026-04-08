# ResiliNet: AI-Driven Financial Contagion Simulator

## Executive Summary

ResiliNet is a high-performance, full-stack financial simulation engine designed to model, predict, and mitigate systemic risk within complex interbank lending networks. 
Live link - https://resilinet-core-4ays0xtz4-parths-projects-8b1cb9fa.vercel.app/

Moving beyond traditional, static financial modeling, ResiliNet introduces a live, interactive Neural Lattice. It simulates how localized financial shocks—such as a bank losing assets during market panic—propagate through a network, potentially triggering a cascading economic collapse. By combining Graph Theory, Game Theory, and Machine Learning (GATv2), ResiliNet provides a real-time stress-testing environment with an automated Central Counterparty (CCP) clearing system that actively intervenes to penalize risky behavior.

## Core Architecture

The platform operates on a robust, decoupled architecture:
*   **Frontend (React/Vite):** A high-fidelity, interactive visualization dashboard featuring dynamic network graphs (`react-force-graph`), centralized state management (Zustand), and a cinematic dark-mode UI customized with Tailwind CSS glassmorphism layers.
*   **Backend (Flask/Python):** A stateless API driving the simulation engine.
*   **Neural Graph Engine (PyTorch Geometric):** Implements Graph Attention Networks (GATv2) to calculate predictive risk probabilities across lending relationships.
*   **Contagion Logic (NetworkX):** Models the intricate web of interbank liabilities, capital buffers, and cascading default mechanics.

## Key Mechanisms

1.  **GATv2 Neural Risk Engine:** Graph Attention Networks dynamically weigh neighbor risk, identifying toxic contagion paths and predicting network failures 1-2 rounds before standard regulatory metrics.
2.  **Nash Equilibrium Stabilizer:** Uses game-theoretic models where individual banks autonomously shift between `RISK_ON` (investing) and `RISK_OFF` (hoarding) strategies, converging toward macro-level stability.
3.  **Algorithmic CCP Circuit Breaker:** Central Counterparty algorithms utilize eigenvector centrality to identify core "Super Spreaders". High-risk transactions are actively intercepted, rejected, and fined, with emergency market halts triggered upon catastrophic threshold breaches.
4.  **Live Telemetry Dashboard:** Per-node trace panels provide granular views of ML risk probabilities, historical PnL trajectories, and real-time capital health velocities.

## Technical Stack

### User Interface & Visualization
*   React.js 18
*   Vite
*   Zustand (Global State)
*   React Force Graph (Canvas/WebGL)
*   Tailwind CSS (Custom Dark-Glass Aesthetics)

### Simulation Core & Machine Learning
*   Python 3.10+
*   Flask & Flask-CORS
*   PyTorch (CPU/CUDA)
*   PyTorch Geometric (GATv2 implementation)
*   NetworkX
*   SciPy & Pandas

## Local Development & Deployment

The platform is designed to run seamlessly in both containerized production environments and local execution modes.

### 1. Environment Setup

Clone the repository and ensure Python and Node.js are available in your environment.

### 2. Backend Execution

Navigate to the backend directory and install the necessary dependencies via the standard package manager. 
Run the Flask server. The backend operates on a stateless architecture and serves the REST endpoints over exactly port 5000. It includes graceful fallback handling if local execution environments lack PyTorch frameworks, defaulting intelligently to "Logic-Only Mode".

### 3. Frontend Execution

Navigate to the frontend directory, resolve Node dependencies, and start the Vite development server. The frontend requires port 5173 and expects the backend API URL to be configured in `.env`.

### 4. Production Deployment Paths

The codebase is pre-configured with declarative infrastructure files for zero-configuration deployments:
*   **Frontend Edge Services:** Native support for Vercel via internal routing configurations.
*   **Backend WSGI Hosting:** Gunicorn integration and declarative `render.yaml` orchestration for platform-as-a-service providers like Render.

## License

This project is released under the MIT License.
