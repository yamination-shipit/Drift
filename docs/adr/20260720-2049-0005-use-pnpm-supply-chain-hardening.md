---
title: Use pnpm Supply Chain Hardening
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Use pnpm Supply Chain Hardening

## 1.1 Decision

Drift uses pnpm only, with a committed lockfile and hardened install settings.

## 1.2 Required Settings

| Setting | Purpose |
| --- | --- |
| `packageManager` | Pins pnpm for Corepack |
| `minimumReleaseAge` | Avoids brand-new compromised releases |
| `blockExoticSubdeps` | Blocks transitive git/tarball dependency surprises |
| approved build scripts | Keeps dependency lifecycle scripts explicit |

## 1.3 Consequences

CI installs with `pnpm install --frozen-lockfile`. npm, Yarn, Bun, and Deno lockfiles are not committed.
