# ADR-0116: Isomorphic-Git for Mobile Real-Vault Sync

Date: 2026-05-12

## Status

Accepted

## Context

Tolaria mobile needs a path to clone and sync a real vault before the native `TolariaGit` module is available. The Expo development-client build is still blocked locally by an Xcode simulator runtime mismatch, but the product needs simulator-testable vault sync now so iPad and iPhone workflow quality can be evaluated against real Markdown content.

The existing mobile architecture already has app-local vault storage through Expo FileSystem, OAuth through Expo AuthSession, and GitHub tokens stored in SecureStore. What is missing is a Git transport that can use those boundaries without shelling out to terminal Git.

## Decision

Use `isomorphic-git` as the first mobile Git implementation behind the existing `MobileGitTransport` contract. Add a small Expo FileSystem adapter that maps the app-managed vault directory to the promise-style filesystem API expected by `isomorphic-git`.

The first production path supports GitHub HTTPS remotes authenticated by the stored OAuth token. Pull clones the repository into app-local vault storage when `.git` is missing, then uses fast-forward-only pull for existing repositories. Push stages changed/deleted files, creates an automatic mobile checkpoint commit, and pushes through the same OAuth credential callback.

Keep the native `TolariaGit` boundary available for later replacement if libgit2/Rust becomes necessary for performance, SSH, conflict handling, or full desktop parity.

## Consequences

- Real GitHub-backed vaults can be cloned and exercised in the simulator without waiting for a native build.
- OTA updates can improve the JavaScript transport and sync UX, as long as no new native dependency is introduced.
- The first sync path is GitHub OAuth over HTTPS only; SSH and arbitrary Git hosts remain a later native/credential-management slice.
- Conflict resolution remains deliberately out of scope for this slice. Pull is fast-forward-only so divergent histories fail visibly instead of inventing mobile merge behavior.
- The demo seed path must stay disabled for remote-backed vaults, otherwise cloned vaults would be polluted with fixture notes.
