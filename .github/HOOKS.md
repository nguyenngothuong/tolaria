# Git Hooks

This repo uses Husky hooks from `.husky/`. Those files are the source of truth.

## Installation

`pnpm install` runs the `prepare` script and installs the hooks into `.git/hooks`.

If you need to reinstall them manually:

```bash
pnpm exec husky
```

The hooks expect `node` and `pnpm` to be available. If they are installed via `nvm`, the hooks will try to load `~/.nvm/nvm.sh` automatically.

## Policy

- Commit on `main` only, except the long-lived mobile UI foundation branch `mobile-ui-foundation`.
- Push from `main` to `origin/main` only, except `mobile-ui-foundation` to `origin/mobile-ui-foundation`.
- Never use `--no-verify`.
- `.codescene-thresholds` is a ratchet. It can only move up.
- `mobile-ui-foundation` is an experimental mobile UI branch with a scoped fast lane. Routine commits and pushes should not run the full desktop/native suite.

## Pre-commit

`.husky/pre-commit` blocks production commits unless all of the following are true:

- `HEAD` is attached to `main` or `mobile-ui-foundation`
- staged TypeScript files pass `pnpm lint --quiet`
- TypeScript passes `npx tsc --noEmit`
- frontend tests pass via `pnpm test --run --silent`
- current CodeScene Hotspot and Average health are both at or above `.codescene-thresholds`

On `mobile-ui-foundation`, the hook uses a fast lane: hook syntax when hooks changed, plus `pnpm mobile:lint`, `pnpm mobile:typecheck`, and `pnpm mobile:test` when `apps/mobile` or workspace package files changed. It warns, but does not run the full desktop/native suite, if non-mobile production files are staged.

If `CODESCENE_PAT` or `CODESCENE_PROJECT_ID` is missing, the CodeScene portion is skipped, but the rest of the hook still runs.

## Pre-push

`.husky/pre-push` blocks pushes unless all of the following are true:

- the current branch is `main` or `mobile-ui-foundation`
- every pushed branch ref is `refs/heads/main -> refs/heads/main` or `refs/heads/mobile-ui-foundation -> refs/heads/mobile-ui-foundation`
- TypeScript and the Vite build pass
- frontend coverage passes
- Rust lint and Rust coverage pass when `src-tauri/` changed
- the curated Playwright core smoke lane passes via `pnpm playwright:smoke`
- current CodeScene Hotspot and Average health are both at or above `.codescene-thresholds`

On `mobile-ui-foundation`, the default pre-push fast lane runs only scoped mobile checks: hook syntax, `pnpm mobile:lint`, `pnpm mobile:typecheck`, `pnpm mobile:test`, and `pnpm mobile:qa:screenshots`. It intentionally skips desktop build, root coverage, Rust coverage, and Playwright smoke for routine mobile UI iteration. To force the full production gate, run:

```bash
TOLARIA_MOBILE_FULL_GATE=1 git push
```

If the remote CodeScene scores are better than the current thresholds, the hook updates `.codescene-thresholds`, stages it, and stops the push. Commit that file normally, then push again. The hook does not auto-commit or bypass itself.

## Legacy Files

The legacy `pre-commit` file under `.github/hooks/` is archival only. Do not copy it into `.git/hooks`; use Husky and `.husky/` instead. The old design `post-commit` auto-implementation hook was removed because it depended on obsolete one-off scripts. `install-hooks.sh` remains as a reinstall helper that runs Husky.

## Troubleshooting

If a hook cannot find `node` or `pnpm`:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use node
```

Then retry the commit or push.
