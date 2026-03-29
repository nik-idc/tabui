# AGENTS.md

This document provides practical guidance for AI agents working on the TabUI codebase.

## Core Commands

```bash
npm run build        # Compile TypeScript to dist/ (tsc --build)
npm run clean        # Clean build artifacts
npm run dev          # Start Vite dev server for the editor
npm run build_vite   # Build the editor with Vite
npm run preview_vite # Preview the Vite build
npm run test         # Run active Jest test suites
```

## Tests

- Active tests are in:
  - `tests/model/`
  - `tests/controller/`
- Archived tests are in `tests/archive/` and are intentionally ignored by Jest.
- Source of truth for test config: `jest.config.cjs`.

## Validation Notes

- `npm test` is the primary regression check for active work.
- `npm run build` may include failures from legacy/deprecated areas outside the active notation/controller surface. Treat build output carefully and isolate whether failures are caused by your changes.

## Editor Fixtures

The editor supports fixture selection through the `fixture` query parameter:

- `fixture=empty` -> empty score fixture
- `fixture=default` (or missing) -> default/full fixture
- `fixture=selection_perf` -> larger selection/performance fixture

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
        - `Beat[]`
          - `Note[]`
            - `Technique[]`

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

### Render

- SVG renderer code is under `src/notation/render/svg/`.
- Renderer currently depends on concrete element classes for reconciliation.

## Patterns and Practices

- Command pattern is used for undoable edits (`execute`, `undo`, `redo`).
- Keep behavior changes small and verifiable with tests.
- Prefer correctness and clarity over broad refactors during stabilization-focused work.
- Avoid adding comments unless the logic is non-obvious.
