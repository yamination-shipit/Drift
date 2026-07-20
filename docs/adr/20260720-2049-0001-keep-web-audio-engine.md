---
title: Keep Existing Web Audio Engine
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Keep Existing Web Audio Engine

## 1.1 Decision

Drift keeps its procedural Web Audio API engine. React owns UI state and wiring; it does not replace the sound synthesis model.

## 1.2 Reasons

| Reason                               | Impact                                  |
| ------------------------------------ | --------------------------------------- |
| The engine already works             | Lowest regression risk                  |
| No external audio files              | App stays small and offline-friendly    |
| Web Audio works in Capacitor WebView | One engine serves web, iOS, and Android |

## 1.3 Consequences

Native background support is handled by Capacitor/platform setup around the WebView. Audio logic remains browser-first unless device testing proves a native audio engine is required.
