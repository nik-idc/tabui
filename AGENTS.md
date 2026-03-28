# AGENTS.md

This document provides guidelines for AI agents working on the TabUI codebase.

## Core Commands

```bash
npm run build        # Compile TypeScript to dist/ (tsc --build)
npm run clean        # Clean build artifacts
npm run dev          # Start Vite dev server for the editor
npm run build_vite   # Build the editor with Vite
npm run preview_vite # Preview the Vite build
npm run test         # Run all Jest tests
```

## Tests

There is a tests/ directory but it's not been updated for a very long time.
The tests in this directory are outdated and should not be used.
It is better to assume this project does not have any tests for now.

## Code Quality

```bash
# No ESLint configured. Code formatting is handled by Prettier.
npx prettier --write src/  # Format source files (manual)
```

## Code Style Guidelines

## TypeScript Configuration

- Strict mode is enabled (`strict: true` in tsconfig.json)
- Use explicit types for function parameters and return values
- Generics are used when appropriate (e.g., `Bar<I extends MusicInstrument>`)
- Path aliases: Use `@/` to import from `src/` (e.g., `@/shared`, `@/player`)

## Naming Conventions

- **Classes**: PascalCase (e.g., `TabUIEditor`, `TrackController`)
- **Interfaces**: PascalCase (e.g., `Command`, `BarJSON`)
- **Variables/Properties**: camelCase (e.g., `currentBeat`, `trackElement`)
- **Private/Internal Properties**: Prefix with underscore (e.g., `_trackElement`, `_scorePlayer`)
- **Constants**: UPPER_SNAKE_CASE or camelCase for objects (e.g., `INSTRUMENT_TYPES`)
- **Files**: kebab-case for general files, PascalCase for classes/interfaces matching the export

## Imports and Exports

- Use named exports for module organization (e.g., `export class Foo`)
- Use `export * from "./module"` for barrel exports
- Group imports: external packages first, then path aliases, then relative imports
- Example:
  ```typescript
  import { defineConfig } from "vite";
  import path from "path";
  import { ScorePlayer } from "@/player";
  import { Track } from "../model";
  ```

## Formatting (Prettier)

- **Quotes**: Double quotes (`"`) - do not use single quotes
- **Semicolons**: Always include (`;`)
- **Indentation**: 2 spaces (no tabs)
- **Line width**: 80 characters
- **Trailing commas**: ES5 compatible
- **Arrow function parens**: Always (`(x) => x + 1`)
- **Bracket spacing**: true (`{ foo }` not `{foo}`)

## Class Structure

- Readonly properties first, then public, then private
- Constructor after property declarations
- Public methods, then private methods
- Any private methods meant for a specific public method go before the public method
- Use JSDoc comments for public APIs:
  ```typescript
  /**
   * Starts player
   */
  public startPlayer(): void { ... }
  ```
- Private members use underscore prefix (`_propertyName`)
- Readonly properties for immutable references (`readonly track: Track`)

## Error Handling

- Throw `Error` with descriptive messages for invalid states
- Validate inputs in constructors and setters, throw on invalid values
- Use `try/catch` blocks in tests to verify error throwing
- Example:
  ```typescript
  if (this._initialized) {
    throw new Error("TabUIEditor already initialized");
  }
  ```

## File Organization

```
src/
  index.ts                    # Main barrel export
  tabui-editor.ts             # Main editor class
  notation/                   # Music notation logic
    model/                    # Data models (Bar, Beat, Note)
    controller/               # Controllers (TrackController, etc.)
    render/                   # Rendering logic
  callbacks/                  # Event handlers (keyboard, mouse, UI)
  ui/                         # UI components
  shared/                     # Shared utilities (Rect, Point, etc.)
  player/                     # Audio playback
tests/
  models/                     # Model unit tests
  tab-window/                 # Tab window tests
```

## General Patterns

- **Command Pattern**: Use the `Command` interface for undoable actions with `execute()`, `undo()`, `redo()`
- **Component Pattern**: UI uses component-based architecture (`NotationComponent`, `UIComponent`)
- **Controller Pattern**: Separate controllers for editing and playback (`TrackControllerEditor`, `ScorePlayer`)
- Avoid comments unless explaining complex logic (JSDoc for public APIs is fine)
- Keep functions focused and small
- Use `undefined` instead of `null` for optional values
- Avoid events for state management

## Project explanation

- TabUI is a music notation library with most of the focus on guitar tablature.
- It handles a single score that can contain multiple tracks
- Only one track can be viewed at any given time

## View

(This is just the general idea)
+---------------------------------------------------------------+
| [Tracks switch] [Add Track] [Volume controls] [Play controls] |
+--Controls---+-------------------------------------------------+
| Duration | |
| Techniques | MAIN NOTATION / TABLATURE AREA |
| Measure | |
+-------------+-------------------------------------------------+

## Model Overview

General overview of the project's model layer
(Some details may be left out)

- Score
  - MasterBar
  - Track
    - Bar
      - Beat
        - Note
          - Technique

## Project structure

General overview of the project's structure
(Some details may be left out)

- TabUIEditor instance
  - Callbacks
    - Mouse Callbacks
    - Keyboard callbacks
    - UI Callbacks
      - Top Part Callbacks
        - Score Controls Calllbacks
        - Play Controls Callbacks
      - Side Part Callbacks
        - Note Controls Callbacks
        - Techniques Controls Callbacks
        - Measure Controls Callbacks
  - UI Component
    - Top Controls Component
      - Score Controls Component
      - Play Controls Component
    - Side Controls Component
      - Note Controls Component
      - Techniques Controls Component
      - Measure Controls Component
  - Notation Component
    - Renderer
    - Track Controller
      - Score Player
      - Track Controller Editor
      - Track Element
        - Track Line Elements
          - Track Line Info Element
          - Staff Line Elements
            - Notation Style Line Elements
              - Technique Gap Element
              - Bar Elements
                - Beat Elements
                  - Note Elements
                    - Technique Element
