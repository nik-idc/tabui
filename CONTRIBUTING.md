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

Run `npm run verify` before submitting any change. It checks TypeScript, builds the
package and demo, and runs unit, integration, and browser tests.
Also run `npx eslint .` and `git diff --check`.

Useful focused commands:

| Command                            | Purpose                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `npm run test:unit`                | Run unit tests and test type checks                        |
| `npm run test:integration`         | Run integration tooling tests and all four consumer tests  |
| `npm run test:integration-tooling` | Test changes to the integration runner and consumer setup  |
| `npm run test:raw-integration`     | Test the raw JavaScript demo                               |
| `npm run demo:raw`                 | Launch the main showcase with source hot reload            |
| `npm run test:react-integration`   | Test the React demo                                        |
| `npm run demo:react`               | Build TabUI and launch the React demo                      |
| `npm run test:angular-integration` | Test the Angular demo                                      |
| `npm run demo:angular`             | Build TabUI and launch the Angular demo                    |
| `npm run test:vue-integration`     | Test the Vue demo                                          |
| `npm run demo:vue`                 | Build TabUI and launch the Vue demo                        |
| `npm run test:e2e`                 | Build and run browser tests in Chromium and Firefox        |
| `npm run benchmark:updates`        | Compare local layout and update performance                |
| `npm run build:package`            | Build the library into `dist/`                             |
| `npm run build:demo`               | Build the demo into `demo/dist/`; requires a package build |

Run `npm run build:package` before focused integration tests or
`npm run test:integration`, and before `npm run build:demo`, to use the current
library build. Integration tests check the installed package's types, builds,
and browser behavior. Focused checks do not replace `npm run verify`.

`npm run test:e2e` builds the current source and starts its own server at
`http://127.0.0.1:4173/tabui/`. No package build or dev server is needed.

On a smaller machine, limit test workers with:

```sh
npm run test:unit -- --maxWorkers=2
npm run test:e2e -- --workers=2
```

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

Add or remove SVG icons in `assets/img/` and `assets/img-dark/`.
No registry or generation command is needed.

## Releases and deployment

Pull requests and pushes to `master` run `npm run verify` in CI. Tags matching
`v*` run the same checks and deploy `demo/dist` to GitHub Pages. Set the Pages
source to **GitHub Actions**. The maintainer creates and pushes release tags.

Before a release, review [ROADMAP.md](ROADMAP.md), run the update benchmark, and
smoke-test editing, playback, persistence, and editor mount/disposal in the demo.
Record user-visible changes in the GitHub release notes.
