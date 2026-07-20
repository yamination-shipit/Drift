---
title: Enforce Commit Quality With Commitlint
date: 2026-07-20
last_updated: 2026-07-20T20:49:24+00:00
type: adr
status: accepted
---

# 1. Enforce Commit Quality With Commitlint

## 1.1 Decision

Drift uses commitlint to enforce readable Conventional Commit messages. Intermediate commits may include a leading gitmoji.

## 1.2 Rules

| Rule | Reason |
| --- | --- |
| Conventional Commit type | Keeps history searchable |
| Imperative summary | Keeps PR titles readable |
| Optional leading gitmoji | Matches requested workflow without requiring it |

## 1.3 Consequences

The final branch commit should be plain Conventional Commit if it may become a PR title.
