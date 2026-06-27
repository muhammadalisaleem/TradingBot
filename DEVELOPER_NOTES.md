# MEXC Hedge Bot Developer Notes

## Project Purpose
This repository contains a minimal starter implementation for the MEXC hedge bot described in the developer guide. The current build focuses on a local, observable prototype with a simple UI for monitoring bot state and simulated trades.

## Current Status
- Backend: Express server with JSON-backed state storage
- Frontend: lightweight dashboard for settings, recent trades, and logs
- Mode: paper-first by default
- Storage: local JSON files under data/

## Project Structure
- server/index.js — HTTP API and state persistence
- public/index.html — dashboard UI
- data/ — runtime state files

## Implementation Notes
- Secrets are intentionally not wired into the first version. Production work should move to environment variables.
- The current UI is designed for monitoring and manual control of a local prototype, not for production-grade trading.
- Trade lifecycle handling is simplified and meant to be extended into real DEX and MEXC modules later.

## Recommended Next Steps
1. Add real MEXC API client modules for market data, balances, orders, and deposit tracking.
2. Add a Solana/Jupiter adapter for quotes and swaps.
3. Replace JSON storage with a persistent database if the bot becomes long-running.
4. Add authentication and role-based access to the dashboard.
5. Introduce structured logging and metrics.

## Developer Workflow
- Install dependencies with npm install
- Start the app with npm run dev
- Open http://localhost:3000

## Risks and Guardrails
- Always validate profit thresholds before executing any order.
- Preserve trade state across restarts.
- Keep live mode disabled until all risk checks are implemented.
- Never hard-code secrets or API keys in the repo.
