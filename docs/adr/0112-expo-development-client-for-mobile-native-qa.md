# ADR-0112: Expo Development Client for Mobile Native QA

Date: 2026-05-05

## Status

Accepted

## Context

Tolaria mobile currently runs in Expo Go for quick simulator validation. Expo Go is useful early, but its development overlay and fixed native runtime make it a poor fit for repeatable native interaction QA. The mobile roadmap needs simulator coverage for create, open, edit, autosave, properties, and delete flows without Expo Go controls blocking screenshots or taps.

Tolaria also needs to keep the over-the-air update strategy from ADR-0109. Adding native QA support must not turn the app into a permanently checked-in generated native project before the native module boundary is ready.

## Decision

Install `expo-dev-client` in `apps/mobile` and add explicit scripts for development-client startup and iOS simulator builds.

Keep generated `ios/` and `android/` folders ignored for now. Local native builds may generate them as disposable prebuild output, but the committed source of truth remains the managed Expo app plus config until Tolaria adds custom native Git/storage modules.

## Consequences

- Simulator QA can move from Expo Go to a Tolaria development build, removing Expo Go overlay controls from interaction screenshots.
- Native runtime changes still require rebuilding the development client, while JavaScript/style changes can continue through Metro and later EAS Update.
- The repository avoids large generated native churn until a custom native module makes checked-in native project files worthwhile.
- Any future CI/device test lane can build from Expo config first, then run the simulator interaction suite against the dev-client app.

## Advice

Use `pnpm mobile:ios:dev-client` to build/install the iOS development client when native interaction QA is needed. Use `pnpm mobile:start:dev-client` for the matching Metro server.

Do not commit generated `apps/mobile/ios` or `apps/mobile/android` folders unless a later ADR explicitly changes the native project ownership model.
