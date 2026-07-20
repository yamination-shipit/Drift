---
title: Enforce Style With Prettier And Husky
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Enforce Style With Prettier And Husky

## 1.1 Decision

Drift uses Prettier and Husky to run cheap local checks before commits.

## 1.2 Reasons

| Check | Reason |
| --- | --- |
| Prettier | Avoids style churn |
| TypeScript | Catches typed domain mistakes |
| Vitest | Protects pure behavior |

## 1.3 Consequences

Hooks stay small and deterministic. Long or flaky checks belong in CI, not the local commit path.
