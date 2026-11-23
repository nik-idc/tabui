# Shared score fixtures

This folder owns the scores used by demos, tests, and the update benchmark. Each
factory returns a fresh score. Demo menus and controls stay in `demo/`;
test-only tools stay in `tests/`.

- `feature-showcase-score.json`: the showcase, saved from TabUI.
- `feature-showcase-score.ts`: loads the showcase with `deserializeScore`.
- `guitar-pro-7.musicxml`: a score made in Guitar Pro 7.5 and exported as
  MusicXML, with one feature per bar. MusicXML import tests compare it with
  what the score holds in Guitar Pro.
- `performance-stress-score.ts`: the demo's dense stress score.
- `update-benchmark-score.ts`: the dense controller-update benchmark score.
- `score-builder.ts`: fills bars, staves, and tracks, and builds scores for the
  generated fixtures.

The demo's empty score is `new Score()`, so it has no file here.

To change the showcase, open it in the demo, edit it, save it, and replace
`feature-showcase-score.json` with the saved file. `json.d.ts` types JSON
imports as `unknown`, so the large file doesn't slow type checks.

Factories import only model exports from `@atikincode/tabui`. Browser development
and unit tests map the package to source. Production demo builds and isolated
consumer tests resolve the built package, without changing the fixture code.

The Node benchmark uses `scripts/tsconfig.json` to map these model imports directly
to source models. This keeps the benchmark's models and controllers on the same
implementation without loading browser assets. Run it through
`npm run benchmark:updates` so this mapping is applied.
