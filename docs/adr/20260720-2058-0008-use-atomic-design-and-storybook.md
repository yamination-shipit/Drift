---
title: Use Atomic Design And Storybook
date: 2026-07-20
last_updated: 2026-07-20T20:58:00+00:00
type: adr
status: accepted
---

# 1. Use Atomic Design And Storybook

## 1.1 Decision

Drift organizes React UI as atoms, molecules, organisms, and pages. Storybook is the component workbench and component test surface.

## 1.2 Reasons

| Choice           | Reason                                            |
| ---------------- | ------------------------------------------------- |
| Atomic folders   | Small shared vocabulary for UI composition        |
| Storybook        | Tests visual states without booting the whole app |
| Shallow taxonomy | Avoids abstract layers with no reuse              |

## 1.3 Consequences

Components move up the taxonomy only when they compose smaller parts. One-off layout code stays in the page.
