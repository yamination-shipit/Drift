# Drift - Ambient Sound

Live app: https://yamination-shipit.github.io/Drift/

Drift is a React/Vite Web Audio app wrapped with Capacitor for iOS and Android.
The web build is deployed to GitHub Pages.

## Build

```bash
corepack enable
corepack prepare pnpm@11.15.1 --activate
pnpm install
pnpm exec playwright install --only-shell chromium
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm build
```

## Device Audio Check

Before releasing a native build, listen on phone speakers and headphones: start each built-in scene, combine several scenes, adjust their volumes, and verify clean fades, no clipping, and background playback.

## Run Native

```bash
pnpm cap sync
pnpm cap open ios
pnpm cap open android
```

Device CLI runs:

```bash
pnpm cap run ios --target <device-id>
pnpm cap run android --target <device-id>
```

## GitHub Flow

1. Work on a branch.
2. Commit small slices with Conventional Commits; gitmoji is allowed for intermediate commits.
3. Push and open a PR.
4. Pages deploys from `main` after checks pass.
5. Release Please opens release PRs from commit history; merging its PR cuts the release.

## Checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm build
pnpm build-storybook
```
