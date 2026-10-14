# Contributing to TabUI

Read [Code Style](docs/code-style.md) before editing or reviewing code.
The same rules apply to human and agent contributors.

Read [Domain Model and Terms](docs/domain.md) for score structure and notation
vocabulary.

## Setup

Use Node.js 20 or later and npm.

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
package, runs unit, packed-consumer, and browser tests, then builds the demo.
Also run `npx eslint .` and `git diff --check`.

Useful focused commands:

| Command                      | Purpose                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| `npm run test:unit`          | Unit tests and test TypeScript checks                               |
| `npm run test:pack-consumer` | Build a separate packed-package app and check its icons in Chromium |
| `npm run test:e2e`           | Chromium and Firefox browser tests                                  |
| `npm run benchmark:updates`  | Local layout/update performance comparison                          |
| `npm run build:package`      | Library output in `dist/`                                           |
| `npm run build:demo`         | Demo output in `demo/dist/`                                         |

## Repository layout

- `src/`: library code.
- `demo/`: browser demo and score fixtures.
- `assets/`: shared runtime icons and demo audio samples. Only icons ship in npm.
- `tests/`: unit, package-consumer, and browser tests.
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
