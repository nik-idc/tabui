# Development

This file contains details for working on TabUI. For setup and contribution rules,
see [Contributing](CONTRIBUTING.md).

## Checks

Run `npm run verify` before submitting any change. It checks TypeScript, builds the
package and demo, and runs unit, integration, and browser tests.
Also run `npx eslint .` and `git diff --check`.

Useful commands:

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
`http://127.0.0.1:4173/tabui/`. You do not need to build the package or start a dev
server first.

On a smaller machine, limit test workers with:

```sh
npm run test:unit -- --maxWorkers=2
npx playwright test --grep-invert @clipboard --workers=2
npx playwright test --grep @clipboard --workers=1
```

Run clipboard tests one at a time so they do not overwrite each other's copied
data. The last command does this with `--workers=1`. `npm run test:e2e` runs both
browser test groups automatically.

## Framework demos

Each framework demo uses the same app as its integration test.

| Demo and lifecycle guide          | Address                 |
| --------------------------------- | ----------------------- |
| [React](demo/react/README.md)     | `http://127.0.0.1:5174` |
| [Angular](demo/angular/README.md) | `http://127.0.0.1:5175` |
| [Vue](demo/vue/README.md)         | `http://127.0.0.1:5176` |

## Repository layout

- `src/`: TabUI source code.
- `demo/raw/`: main showcase. The website's demo page runs the same code.
- `demo/react/`: React consumer demo, also used by its integration test.
- `demo/angular/`: Angular consumer demo, also used by its integration test.
- `demo/vue/`: Vue consumer demo, also used by its integration test.
- `assets/`: shared runtime icons and demo audio samples. Only icons ship in npm.
- `tests/`: unit, framework integration, and browser tests.
- `tests/helpers/`: test-only utilities.
- `fixtures/`: score builders and factories shared by demos, tests, and benchmarks.
- `docs/`: user, embedding, and developer documentation.

Add or remove SVG icons in `assets/img/` and `assets/img-dark/`.
No registry or generation command is needed.

## Architecture

It helps to think about TabUI's code in layers. These are concepts, not strict
definitions.

- **Model**: the musical data, in `src/notation/model/`.
- **Editor**: code that changes the model, such as `ScoreEditor`.
- **Command**: undoable edits (execute, undo, redo), built on the editor layer.
- **Element**: geometry calculated from the model, from `TrackElement` down the
  tree. The name "Element" is a bit awkward, but it is deeply ingrained in
  TabUI, so it stays.
- **Player**: playback scheduling with the Web Audio API, based on the model.
  See [Playback Architecture](docs/playback.md).
- **Controller**: the editor state. It runs model edits through commands, and
  handles selection and playback. For example, it tracks whether playback is
  active and whether editing is allowed.
- **Renderer**: turns element geometry into DOM output. Currently SVG only.
- **UI**: the editor UI in `src/ui/`.

See [Domain Model and Terms](docs/domain.md) for the musical concepts.

### Model details

- Voice slots are numbered 1 to 4. An unused slot is `null`.
- `Beat.notes === null` means the beat is a rest. A rest has no beat techniques.
- `VoiceBar.isEmpty()` means `beats.length === 0`.
- Beat techniques (`BeatTechnique`, `BeatGuitarTechniqueType`) are a separate
  family from note techniques, with their own types, options, and edit rules. Do
  not merge the two families or their enums: both are numeric enums, so one
  value would mean two techniques.

## Score format versions

The score format has its own version, a plain integer. It is separate from the
TabUI package version. Each version lives in its own folder, such as
`src/notation/model/serialization/v1/`.

- New optional fields do not change the version. Older files still load, and
  missing fields get their default values.
- A breaking change, such as a removed, renamed, or changed field, needs a new
  version folder. The previous folder stays frozen and gets one migration step to
  the new version.
- TabUI must read every older version it has ever saved.

## Releases and deployment

Pull requests and pushes to `master` run `npm run verify` in CI. Tags matching
`v*` run the same checks and deploy the site to GitHub Pages: the VitePress site
from `docs/` at the root, and the API reference under `api/`. The demo page
(`docs/demo.md`) mounts the raw demo from `demo/raw/` and uses TabUI from source.
The VitePress config serves the demo's audio samples from `assets/samples`
and copies them into the build. `TABUI_SITE_BASE` sets the
base path, so another host can use a different one. The API reference's links
in `typedoc.json` use the same path.

- `npm run site:build` builds both into `site/dist`. A plain
  `vitepress build` empties that folder, so always use this command.
- `npm run site:preview` runs the full build, then serves the site.
- `npm run site:dev` live-reloads the VitePress pages, including the demo. The
  API link shows a 404 there.

Set the Pages
source to **GitHub Actions**. The maintainer creates and pushes release tags.

Before a release, review [ROADMAP.md](ROADMAP.md), run the update benchmark, and
smoke-test editing, playback, persistence, and editor mount/disposal in the demo.
Record user-visible changes in the GitHub release notes.
