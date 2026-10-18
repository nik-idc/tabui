# Contributing to TabUI

Read [Code Style](docs/code-style.md) before editing or reviewing code.
The same rules apply to human and agent contributors.

Read [Domain Model and Terms](docs/domain.md) for score structure and notation
vocabulary.

## Setup

Use a supported Node.js LTS release (20.19+, 22.12+, or 24+) and npm.

```sh
npm ci
npm run dev
```

The demo opens at `http://localhost:5173/tabui/`.

## Checks

Install the browser test dependencies before the first full check:

```sh
npx playwright install --with-deps chromium firefox
```

Run `npm run verify` before submitting a change. It checks TypeScript, builds the
package, runs unit, raw, React, Angular, and Vue integration, and browser tests, then
builds the demo.
Also run `npx eslint .` and `git diff --check`.

Useful focused commands:

| Command                            | Purpose                                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| `npm run test:unit`                | Unit tests and test TypeScript checks                               |
| `npm run test:raw-integration`     | Raw showcase and lifecycle: package types, builds, browser behavior |
| `npm run demo:raw`                 | Launch the main showcase with source hot reload                     |
| `npm run test:react-integration`   | React consumer: types, Strict Mode, and production build            |
| `npm run demo:react`               | Build TabUI and launch the React integration demo                   |
| `npm run test:angular-integration` | Angular app: TypeScript/templates, development and production       |
| `npm run demo:angular`             | Build TabUI and launch the Angular integration demo                 |
| `npm run test:vue-integration`     | Vue app: TypeScript/templates, development and production           |
| `npm run demo:vue`                 | Build TabUI and launch the Vue integration demo                     |
| `npm run test:e2e`                 | Chromium and Firefox browser tests                                  |
| `npm run benchmark:updates`        | Local layout/update performance comparison                          |
| `npm run build:package`            | Library output in `dist/`                                           |
| `npm run build:demo`               | Demo output in `demo/dist/`                                         |

The consumer integration tests run small TabUI apps in Chromium using Playwright.
Each test copies a demo into a temporary directory, installs a local TabUI package
file made with `npm pack`, and checks the app's types, build, and browser behavior.
This tests the package users install, rather than importing library source files
directly. The test scripts also stop their servers and remove the temporary files.

Run `npm run build:package` before a focused integration test so the package
contains the current library build. `npm run test:integration` runs all four
consumer tests. These are Node.js scripts using Playwright's browser tools and
assertions; the separate `tests/e2e/` suite uses the Playwright Test runner.

Each framework demo uses the same app as its integration test. Press Ctrl+C to
stop the server and remove its temporary install:

| Demo and lifecycle guide          | Address                 |
| --------------------------------- | ----------------------- |
| [React](demo/react/README.md)     | `http://127.0.0.1:5174` |
| [Angular](demo/angular/README.md) | `http://127.0.0.1:5175` |
| [Vue](demo/vue/README.md)         | `http://127.0.0.1:5176` |

## Repository layout

- `src/`: library code.
- `demo/raw/`: main showcase; deployed to GitHub Pages.
- `demo/react/`: React consumer demo, also used by its integration test.
- `demo/angular/`: Angular consumer demo, also used by its integration test.
- `demo/vue/`: Vue consumer demo, also used by its integration test.
- `assets/`: shared runtime icons and demo audio samples. Only icons ship in npm.
- `tests/`: unit, framework integration, and browser tests.
- `tests/helpers/`: test-only utilities.
- `fixtures/`: score builders and factories shared by demos, tests, and benchmarks.
- `docs/`: usage, code style, and playback architecture.
- `AGENTS.md`: model overview and coding-agent guidance.
- `ROADMAP.md`: release work and future plans.

`vite.config.js` builds and serves the demo. `vite.config.lib.js` builds the
library. Both inline icons from `assets/` as data URLs. The demo also serves
audio samples through Vite's `publicDir` option.

All icons live in `assets/img/` and `assets/img-dark/`. Vite discovers and bundles
them directly through `import.meta.glob` in `src/assets.ts`. Add or remove SVG
files there; no registry or generation command is needed.

## Releases and deployment

Pull requests and pushes to `master` run `npm run verify` in CI. Tags matching
`v*` run the same checks and deploy `demo/dist` to GitHub Pages. Set the Pages
source to **GitHub Actions**. The maintainer creates and pushes release tags.

Before a release, review [ROADMAP.md](ROADMAP.md), run the update benchmark, and
smoke-test editing, playback, persistence, and editor mount/disposal in the demo.
Record user-visible changes in the GitHub release notes.
