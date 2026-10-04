# AGENTS.md

This document provides practical guidance for AI agents working on the TabUI codebase.

## Core Commands

`npm run verify` checks types, builds the package, runs unit, package-consumer,
and Playwright tests, then builds the demo. A passing run does not prove that
all behavior is correct. See `package.json` for individual commands.

## Coding Rules

Before editing or reviewing code, read [Code Style](docs/code-style.md).
These rules apply to both human and agent contributors. See
[Contributing](CONTRIBUTING.md) for verification steps.

## Tests

- Unit tests are in `tests/unit/`, integration tests are in
  `tests/integration/`, and Playwright tests are in `tests/e2e/`.
- Prefer TDD when it fits the task. Use the `tdd` skill for further guidance.

## Architecture Overview

- TabUI currently renders tablature. Classic notation has partial scaffolding
  but is not implemented.
- Each `NotationComponent` displays one active track at a time.
- Playback schedules all tracks through per-track audio buses, including muted
  and non-soloed tracks. Bus gains control which tracks are audible.

### Model (conceptual)

Models are under `src/notation/model/`:

```text
Score
  masterBars: MasterBar[]
  tracks: Track[]
    staves: Staff[]
      bars: Bar[]
        voiceBars: Record<VoiceNumber, VoiceBar | null>
          beats: Beat[]
            notes: Note[] | null
              techniques: Technique[]
```

- `VoiceNumber` is `1 | 2 | 3 | 4`; each slot can be `null`.
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
- `src/notation/controller/layout/score-layout-plan.ts` contains
  `ScoreLayoutPlanner`, which calculates score-wide line breaks and finalized
  bar widths across all tracks.
- `element/track/track-element-skeleton-builder.ts` uses that plan to build
  track skeletons and predict line heights for lazy materialization. Single-line
  mode uses the plan's intrinsic bar widths instead of wrapped lines.

### Render

- SVG renderer code is under `src/notation/render/svg/`.
- `EditorSVGRenderer` renders materialized viewport lines and may retain
  offscreen renderer instances for reuse.

### Playback

- Playback is implemented directly with Web Audio under `src/player/`.
- See [Playback Architecture](PLAYBACK.md) for module roles and scheduling.

## Patterns and Practices

- Command pattern is used for undoable edits (`execute`, `undo`, `redo`).
- Commands expose affected model anchors through `affectedModels`; do not
  reintroduce eager update-type semantics such as horizontal/vertical/targeted
  command update requests.
- Keep behavior changes small and verifiable with tests.
- Do not commit or push unless the user explicitly asks. Read-only Git operations
  and `git stash push` / `git stash apply` are allowed. Leave other Git operations
  that change repository state to humans unless explicitly requested.

## Communication & Response Guidelines

Follow the principles of the **Google Developer Documentation Style Guide** and
**ASD-STE100 (Simplified Technical English)** across all text outputs.

Keep your language and response structure as simple as you can. It should be understandable by
a teenager whose English level is at best B1.
