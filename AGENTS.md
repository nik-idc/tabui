# AGENTS.md

This document provides practical guidance for AI agents working on the TabUI codebase.

## Core Commands

```bash
npm run build        # Compile TypeScript to dist/ (tsc --build)
npm run benchmark:updates # Run focused-vs-full update benchmark
npm run clean        # Clean build artifacts
npm run dev          # Start Vite dev server for the editor
npm run build_vite   # Build the editor with Vite
npm run preview_vite # Preview the Vite build
npm run test         # Run active Jest test suites
npm run format       # Format all files
```

## Tests

- Active tests are in `tests/`.
- Source of truth for test config: `jest.config.cjs`.
- Prefer TDD: whenever possible & makes sense, first make tests and only
  then write the actual functionality. Main goal - avoiding writing tests
  that test only the happy path and/or current flow of execution. Instead,
  tests should check correctness of implementation of intended functionality.

## Validation Notes

- `npm test` is the primary regression check for active work.

## Editor Fixtures

The editor supports fixture selection through the `fixture` query parameter:

- `fixture=empty` -> empty score fixture
- `fixture=feature_showcase` (or missing) -> feature showcase fixture
- `fixture=multi_voice_single_staff` -> multi-voice single-staff fixture
- `fixture=multi_voice_two_staff` -> multi-voice two-staff fixture
- `fixture=performance_stress` -> larger performance stress fixture

## TypeScript and Imports

- Strict mode is enabled (`strict: true` in `tsconfig.json`).
- Path alias `@/` points to `src/`.
- Prefer named exports and barrel exports where they improve discoverability.
- For internal module boundaries, prefer direct imports over broad barrels when possible.

## Code Style Guidelines

- **Classes / Interfaces**: PascalCase
- **Variables / Methods / Properties**: camelCase
- **Private fields**: underscore prefix (e.g., `_trackElement`)
- **Formatting**:
  - double quotes
  - semicolons
  - 2-space indentation
  - line width 80
- Keep `for`, `if`, and similar control-flow headers on one line. If the header
  would become too long, extract local variables before the statement rather than
  splitting the header across lines.

## Architecture Overview

- TabUI is a music-notation-focused library (especially guitar tablature).
- A score can contain multiple tracks.
- UI displays one active track at a time through the notation component.

### Model (conceptual)

- `Score`
  - `MasterBar[]`
  - `Track[]`
    - `Staff[]`
      - `Bar[]`
        - `VoiceBar[1..4] | null`
          - `Beat[]`
            - `Note[] | null`
              - `Technique[]`
- `Bar` stores sparse voice slots `1..4`.
- `Beat.notes === null` means rest beat.
- `VoiceBar.isEmpty()` means `beats.length === 0`.

### Notation controller structure (current)

- `src/notation/controller/editor/`
  - includes command layer in `editor/command/`
- `src/notation/controller/selection/`
- `src/notation/controller/element/`
  - top-level anchors:
    - `track-element.ts`
    - `notation-element.ts`
  - shallow folders:
    - `track/`
    - `staff/`
    - `bar/`
    - `beat/`
    - `note/`
    - `technique/`
  - `track/track-element-skeleton-builder.ts` owns line breaking, finalized bar
    widths, and predicted line heights for lazy line materialization.

### Render

- SVG renderer code is under `src/notation/render/svg/`.
- Renderer currently depends on concrete element classes for reconciliation.
- `EditorSVGRenderer` renders materialized viewport lines and may retain
  offscreen renderer instances for reuse.

## Patterns and Practices

- Command pattern is used for undoable edits (`execute`, `undo`, `redo`).
- Commands expose affected model anchors through `affectedModels`; do not
  reintroduce eager update-type semantics such as horizontal/vertical/targeted
  command update requests.
- Keep behavior changes small and verifiable with tests.
- Prefer correctness and clarity over broad refactors during stabilization-focused work.
- Prefer locality of behavior. Do not introduce trivial one-line
  getters/helpers that only wrap a simple property access used in one
  place.
- If a getter or helper would be a single obvious line such as
  `return this._foo?.bar;`, prefer inlining that expression at the call
  site instead of creating a dedicated method.
- Extract only when the logic is reused, meaningfully named, or complex
  enough that the abstraction improves readability.
- Avoid adding comments unless the logic is non-obvious.
