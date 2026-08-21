# AGENTS.md

This document provides practical guidance for AI agents working on the TabUI codebase.

## Core Commands

```bash
npm run clean              # Clean package build artifacts
npm run dev                # Start the demo Vite server
npm run preview_vite       # Preview the demo Vite build
npm run serve_vite         # Start the demo Vite server without package wrapping
npm run format             # Format all files
npm run benchmark:updates  # Run the focused-versus-full update benchmark
npm run build:package      # Build package ESM, CSS, and TypeScript declarations
npm run build:demo         # Build the demo with Vite
npm run test               # Run Jest unit and integration tests
npm run test:e2e           # Run Playwright tests in Chromium and Firefox
npm run test:e2e:ui        # Open the Playwright test UI
npm run test:e2e:webkit    # Run Playwright tests in WebKit
npm run test:pack-consumer # Build and test the packed consumer fixture
npm run test:all           # Run Jest, packed-consumer, and default Playwright tests
npm run verify             # Run the complete deterministic verification gate
```

## Tests

- Active tests are in `tests/`.
- Source of truth for test config: `jest.config.cjs`.
- Prefer TDD whenever possible & makes sense.
  First make tests and only then write the actual functionality. Main goal -
  avoiding writing tests that test only the happy path and/or flow of execution.
  Tests must check **correctness** of implementation of intended functionality.

## Validation Notes

- `npm run verify` type checks, builds the package, runs `test:all`, and builds
  the demo. Use this command to validate the complete repository state.

## TypeScript and Imports

- Strict mode is enabled (`strict: true` in `tsconfig.json`).
- Prefer enums for finite named value sets. Continue using types or interfaces
  for object shapes, unions of structurally different objects, and composition.
- Prefer one-letter names for variables in internal iterable functions:

```ts
array.find((value) => value.property === neededProp); // BAD
array.find((v) => v.property === neededProp); // GOOD
```

- The demo Vite config supports the `@/` alias, but package/source output must not
  depend on repository-only aliases.
- Prefer named exports and barrel exports where they improve discoverability.
- For internal module boundaries, prefer direct imports over broad barrels when possible.
- Avoice `any`, `!`, `as` and other "trust me bro" operators at all costs. The goal is to
  make TS in this project as strict and as definitive as it possibly can be.

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
- Document all new functionality using JSDoc. Keep it consice, simple but informative.
  Ideally 1-2 sentences that are easy to read and explain clearly what the function does.

## Architecture Overview

- TabUI is a music-notation-focused library (especially guitar tablature).
- A score can contain multiple tracks.
- UI displays one active track at a time through the notation component.
- Playback schedules all tracks through per-track audio buses, even though the
  notation UI displays one active track.

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

### Playback

- Playback is implemented directly with Web Audio under `src/player/`.
- `ScorePlayer` owns transport state and coordinates playback lifecycle.
- `PlaybackScheduler` owns score-material timing and traversal coordination.
- `PlaybackAudioEngine` owns lazy `AudioContext` lifecycle, track/master buses,
  sample loading, note rendering, and scheduled node tracking.
- `PlaybackCursorCoordinator` owns buffered cursor timing and active-track cursor
  event projection.
- `PlaybackNoteScheduler` owns per-note source/envelope creation and lightweight
  technique/tone shaping.
- Samples are configured by instrument tone URL/root note, with oscillator
  fallback when samples are missing or fail to load.
- Track volume, mute, solo, and pan update persistent per-track audio buses.
- Playback cursor events are scoped by player identity and playback generation.
- Editing mutations are ignored while playback is active; copy, transport,
  active-track selection, and track mix controls remain available.
- Technique playback currently uses Web Audio pitch/envelope shaping over the
  same source; it is not multisampling or articulation-specific sampling.

## Patterns and Practices

- Command pattern is used for undoable edits (`execute`, `undo`, `redo`).
- Commands expose affected model anchors through `affectedModels`; do not
  reintroduce eager update-type semantics such as horizontal/vertical/targeted
  command update requests.
- Keep behavior changes small and verifiable with tests.
- **Do not commit/push anything** yourself unless specifically and explicitly
  prompted by the user.

## Communication & Response Guidelines

Follow the principles of the **Google Developer Documentation Style Guide** and
**ASD-STE100 (Simplified Technical English)** across all text outputs.

1. **Directness & Tone**
   - Write in dry, plain, unambiguous Technical English.
   - Use active voice, present tense, and second person ("you").
   - Omit meta-commentary, introductory fluff, or polite preamble. Lead directly with
     the answer or action.

2. **Clarity & Consistency**
   - One concept per sentence. Keep sentence structure simple and scannable.
   - Maintain consistent terminology (do not swap terms or invent new jargon/synonyms
     for the same concept).
   - Use technical jargon only when it is strictly shorter and more precise than plain phrasing.

3. **Formatting & Scanning**
   - Bold the main idea of a point at the beginning of a line/bullet.
   - Limit bolding to at most one short phrase per point (never bold whole
     sentences or paragraphs).
   - Prefer structured lists or short tables over dense walls of text.

To reiterate:
When reporting info to me, be extremely concise and sacrifice grammar for the sake of cohesion.
