---
title: Use Capacitor Native Shell
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Use Capacitor Native Shell

## 1.1 Decision

Drift uses Capacitor for iOS and Android packaging.

## 1.2 Reasons

| Reason | Impact |
| --- | --- |
| Existing app is web-first | Avoids rebuilding native screens |
| Capacitor supports Vite output | Simple build pipeline |
| Native projects remain editable | Allows background-audio permissions and icons |

## 1.3 Consequences

The source of truth is the React/Vite web app. Native projects are generated and synced from `dist`.
