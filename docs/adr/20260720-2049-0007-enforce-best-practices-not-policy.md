---
title: Enforce Best Practices Not Policy
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Enforce Best Practices Not Policy

## 1.1 Decision

Drift automates small practices that prevent real defects. It avoids process rules that only create paperwork.

## 1.2 Guardrails

| Practice | Why It Exists |
| --- | --- |
| Format, typecheck, tests | Finds defects before commit |
| Commitlint | Keeps history useful |
| ADRs | Records decisions with consequences |
| pnpm hardening | Reduces supply-chain risk |

## 1.3 Consequences

Documentation stays short. New policy is added only when it can be enforced cheaply or prevents a known failure mode.
