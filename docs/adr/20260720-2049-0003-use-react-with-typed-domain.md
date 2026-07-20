---
title: Use React With Typed Domain
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Use React With Typed Domain

## 1.1 Decision

Drift uses React and TypeScript for maintainable UI composition, while keeping pure domain logic small and strongly typed.

## 1.2 Reasons

| Reason                                         | Impact                      |
| ---------------------------------------------- | --------------------------- |
| User requested React                           | Easier future maintenance   |
| Scene/mix/timer logic benefits from types      | Fewer storage and date bugs |
| Full clean-architecture layers are unnecessary | Avoids boilerplate          |

## 1.3 Consequences

Domain modules are immutable and functional. React components consume them directly; no service layer is added until there is more than one real implementation.
