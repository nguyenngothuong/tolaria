# Mobile UI Parity

Tolaria mobile UI work starts from fixture-driven parity with desktop semantics. The goal is not to copy desktop layout mechanically. The goal is to recreate the same information architecture, interaction affordances, and visual quality with native React Native surfaces before production logic is wired.

## Fast QA Loop

Routine mobile UI work on `mobile-ui-foundation` uses the scoped checks:

```bash
pnpm mobile:lint
pnpm mobile:typecheck
pnpm mobile:test
pnpm mobile:qa:screenshots
```

`pnpm mobile:qa:screenshots` exports the Expo web bundle, serves it locally, drives the UI lab with Playwright, and writes screenshots plus a manifest to:

```text
/tmp/tolaria-mobile-ui-screenshots
```

The default screenshot matrix is:

| Target | Viewport | Purpose |
| --- | --- | --- |
| Tablet landscape | 1366 x 1024 | First production target and primary quality bar |
| Tablet portrait | 1024 x 1366 | Tablet reflow and panel density |
| Phone portrait | 390 x 844 | Early visibility into phone reduction pressure |

Run the full desktop/native Tolaria gate only before promotion or when desktop/native production files are intentionally changed:

```bash
TOLARIA_MOBILE_FULL_GATE=1 git push
```

## Surface Parity Map

| Priority | Desktop Source | Mobile Target | Required Fixture States | Acceptance Bar |
| --- | --- | --- | --- | --- |
| P0 | Sidebar navigation | Native sidebar rail/list | all notes, inbox, archive, favorites, types, long counts | Touch targets stay stable; labels and counts do not overlap; active state is obvious |
| P0 | Note list | Native note list panel | selected note, favorite note, long title, multi-chip note, empty search | Dense enough for tablet work; rows remain readable; selected/favorite affordances are clear |
| P0 | Editor shell | Native editor container | title, breadcrumb, rich text preview, empty note | Reading area feels like Tolaria; title scale is appropriate; content width is controlled |
| P0 | Properties panel | Native property rows | type, date, status, relationships, empty values | Property labels align; chips match desktop semantics; actions are touch-safe |
| P1 | Search and quick open | Native search overlay/sheet | empty query, results, no results, keyboard focus | Results can be scanned quickly; mouse/touch selection is deterministic |
| P1 | Create note/type/status actions | Native modal/sheet controls | valid input, invalid input, type selection, collision | Controls use Tolaria primitives; disabled/loading/error states are visible |
| P2 | Phone shell | Reduced navigation and panels | list-only, editor-only, properties sheet, back stack | Phone removes surfaces deliberately after tablet parity is established |

## Per-Surface Workflow

1. Identify the desktop source component or workflow.
2. Add or update fixture data for the relevant states.
3. Compose the screen from `apps/mobile/src/ui` primitives.
4. Run the fast QA loop and inspect screenshots.
5. Add interaction checks for taps, selection, scrolling, and state transitions.
6. Wire real data only after the fixture surface passes visual and interaction QA.

## Quality Rules

- Tablet landscape is the quality bar until the tablet shell is stable.
- Phone UI is allowed to lag, but screenshots must reveal where reduction is needed.
- Screens must avoid browser-default styling, text overlap, unstable dimensions, and decorative-only surfaces.
- Mobile-specific copy must go through the shared locale catalog when it becomes production UI copy.
- Business logic is not a substitute for visual completeness. A surface is not ready to wire until the fixture state is coherent.
