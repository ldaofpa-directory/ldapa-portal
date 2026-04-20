# LDAPA Intelligent Portal — Handoff Documentation

This folder contains the complete technical and operational handoff for the LDAPA Intelligent Portal.

## Read order

| # | Document | Audience |
|---|----------|----------|
| 01 | [Technical Requirements and Design](01-technical-requirements-and-design.md) | Engineers, PMs |
| 02 | [System Architecture](02-system-architecture.md) | Engineers |
| 03 | [APIs](03-apis.md) | Engineers integrating with the backend |
| 04 | [Data Modeling & DB Population](04-data-modeling-and-db-population.md) | Engineers, data analysts |
| 05 | [Deployment](05-deployment.md) | Engineers, DevOps |
| 06 | [Handoff](06-handoff.md) | **Non-technical owner(s) — start here** |

## PDF copies

A PDF version of each document sits alongside the `.md` file (same name, `.pdf` extension).

## Diagrams

All diagrams are rendered from Mermaid source files in `../diagrams/`:

- `architecture.mmd` — high-level system architecture
- `chat-pipeline.mmd` — the flow inside a single chat turn
- `search-strategy.mmd` — tiered search fallback
- `auth-flow.mmd` — admin authentication
- `deploy-railway-vercel.mmd` — deployment topology
- `erd.mmd` — database entity-relationship diagram

## Post-deployment support

Through July 31st, 2026 — contact **Hazem El-Sayed** at `hmelsaye@andrew.cmu.edu` or +974 3350 1813 (phone / WhatsApp).
