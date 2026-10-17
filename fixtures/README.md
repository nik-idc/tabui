# Shared score fixtures

This folder owns score builders and factories used by demos, tests, and the update
benchmark. Each factory returns a fresh score. Demo menus and controls stay in
`demo/`; test-only tools stay in `tests/`.

- `score-builder.ts`: fills bars, staves, and tracks, and builds scores.
- `empty-score.ts`: the default empty score.
- `feature-showcase-score.ts`: the main showcase score.
- `multi-voice-score.ts`: single-staff and two-staff multi-voice scores.
- `performance-stress-score.ts`: the demo's dense stress score.
- `update-benchmark-score.ts`: the dense controller-update benchmark score.

All factories use `createScore` from `score-builder.ts` for metadata, master bars,
tracks, and staves. Call it without arguments for the default empty score. Each
`stavesInfo` entry can be either an array of repeated-beat descriptions or a
function that receives the created staff and fills its notation. Multi-voice
fixtures use these functions for their detailed voice and beat definitions.

Factories import only model exports from `@atikincode/tabui`. Browser development
and unit tests map the package to source. Production demo builds and isolated
consumer tests resolve the built package, without changing the fixture code.

The Node benchmark uses `scripts/tsconfig.json` to map these model imports directly
to source models. This keeps the benchmark's models and controllers on the same
implementation without loading browser assets. Run it through
`npm run benchmark:updates` so this mapping is applied.
