# 🛡️ MEV Intent Sentinel

> **Dark Forest Mempool Intent Decoder & Paritok Token-Efficiency Engine**
> 
> *Submission for Build with Paritok: The Token-Efficiency Hackathon*

---

## 📌 Executive Summary

Monitoring decentralized exchange mempools for front-running and sandwich attacks generates gigabytes of raw, highly repetitive hexadecimal calldata. Passing raw EVM transaction traces directly into LLMs creates massive cost and latency bottlenecks due to bytecode padding and execution opcodes.

**MEV Intent Sentinel** solves this by routing live pending transactions from high-performance L1s (like Monad Testnet) through a concurrent **Rust Ingestion Pipeline**, compressing the bytecode using **Paritok Context Compression (`paritok-4b-v1`)**, and calculating real-time attack risk scores using Deterministic Finite Automata (DFA).

---

## 🏗 System Architecture

```text
┌─────────────────────────┐         WSS Pending        ┌─────────────────────────┐
│ Monad / EVM Mempool     │ ─────────────────────────> │ Rust Mempool Ingestion  │
│ (Raw Hex Calldata)      │                            │ (Tokio Async Worker)    │
└─────────────────────────┘                            └────────────┬────────────┘
                                                                    │ Raw Hex Batch
                                                                    ▼
                                                       ┌─────────────────────────┐
                                                       │ Paritok AI Layer        │
                                                       │ (paritok-4b-v1 Proxy)   │
                                                       └────────────┬────────────┘
                                                                    │ Compressed Intent Graph
                                                                    ▼
                                                       ┌─────────────────────────┐
                                                       │ DFA Risk Engine         │
                                                       │ (Sandwich / Front-run)  │
                                                       └────────────┬────────────┘
                                                                    │
                     ┌──────────────────────────────────────────────┴──────────────────────────────────────────────┐
                     │                                                                                             │
                     ▼                                                                                             ▼
       ┌───────────────────────────┐                                                                 ┌───────────────────────────┐
       │ Axum WebSocket Server     │                                                                 │ Foundry Smart Contract    │
       │ (broadcast::intent_tx)    │                                                                 │ (ProofOfIntent.sol)       │
       └─────────────┬─────────────┘                                                                 └───────────────────────────┘
                     │ Real-time Telemetry
                     ▼
       ┌───────────────────────────┐
       │ React 19 Dashboard        │
       │ (Intent Graph & Savings)  │
       └───────────────────────────┘📊 Token Savings & Cost Reduction Math
By utilizing Paritok context compression on raw EVM bytecode prior to AI security evaluation, MEV Intent Sentinel achieves significant optimization:

Raw Input Tokens / Batch: ~150 tokens (bytecode + headers)

Compressed Tokens / Batch: ~45 tokens (intent pruned)

Context Reduction Ratio: 70.0%

Estimated Cost Deflection: $3.50 / 1M Transactions

🚀 Quickstart & Setup Instructions
One-Command Docker Setup (Recommended for Judges)
Bash
# 1. Clone the repository
git clone [https://github.com/your-username/mev-intent-sentinel.git](https://github.com/your-username/mev-intent-sentinel.git)
cd mev-intent-sentinel

# 2. Set your Paritok API key (defaults to mock evaluation mode if empty)
export PARITOK_API_KEY=pk_live_NbP0zlMKT4K0PQ6_jDPWaG4_57nAddbW

# 3. Launch the full stack
docker compose up --build
Access the live dashboard at http://localhost:3000.

📜 License
Distributed under the MIT License. See LICENSE for more information.
