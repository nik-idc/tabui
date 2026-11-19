# AGENTS.md

This document provides guidance for AI agents working on TabUI.

## Core Commands

`npm run verify` runs ESLint, checks types, builds the package, runs unit, raw,
React, Angular, and Vue integration, and Playwright tests, then builds the demo. A passing run does
not prove that all behavior is correct. See [Development](DEVELOPMENT.md) for
focused test commands and test worker limits.

## Coding Rules

Before editing or reviewing code, read [Code Style](docs/code-style.md).
These rules apply to both human and agent contributors. Follow the principles and
verification steps in [Contributing](CONTRIBUTING.md).

## Architecture Overview

Read [Domain Model and Terms](docs/domain.md) before working on notation code.
It describes score structure, voice/rest conventions, and shared vocabulary.

Brief overview of the `src/` folders:

- `config/`: TabUI configuration code.
- `notation/`: model, geometry, rendering, and editing.
- `player/`: playback.
- `shared/`: code shared across the codebase.
- `ui/`: editor UI layout and rendering (dialogs, buttons, etc.).

## Git and version control

Do not commit or push unless the user explicitly asks. Read-only Git operations
and `git stash push` / `git stash apply` are allowed. Leave other Git operations
that change repository state to humans unless explicitly requested.

## Communication

- Keep your responses brief. Use simple English.
- Write docs and comments in plain English, following the Google developer
  documentation style.
