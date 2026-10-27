# Raw demo

This is the main TabUI showcase deployed to GitHub Pages at `/tabui/`. It uses
TypeScript and browser APIs directly, without a UI framework.

Shared score builders and score factories live in the top-level `fixtures/`
folder. The integration consumer copies them alongside the demo and checks them
against the installed package.

```sh
npm run demo:raw
```

This starts the usual Vite development server with source hot reload. The demo
imports TabUI through its public package exports. Local development maps those
imports to source; production builds use the built package:

```sh
npm run build:package
npm run build:demo
```

The output remains `demo/dist/`, used by the existing Pages deployment. Sample
audio comes from `assets/samples/`; samples are demo resources and do not ship in
the npm package.

Use **Demo controls → Playback → Sound source** to compare **FluidR3**
(the default pack), **Free Wave Samples**, and **Synth** (built-in oscillator
tones). Switching stops playback and remounts the editor with the current score.
The choice stays in the URL as `soundSource=samples`, `soundSource=fluidr3`, or
`soundSource=synths`, including after reload. Existing links keep their meaning.
Synth mode does not load samples; all sources use the same playback scheduling
and techniques.

The [FluidR3 subset](../../assets/samples/fluidr3/README.md) contains six
MIT-licensed WAV extracts, not a browser SoundFont engine. Each tone uses one
source pitch and the original sustain loop. SoundFont layers, effects, filters,
and envelopes are not reproduced. See its manifest and offline extraction script
for source hashes, pitch corrections, and loop checks.

## Integration test

```sh
npm run build:package
npm run test:raw-integration
```

The test copies this app into an isolated consumer project, installs the locally
packed npm package, checks its types, and builds it with consumer-local tools.
Chromium checks the showcase at a nested deployment base, including themes,
fixture selection, score download/upload, layout controls, reset, and WAV files.
The deployed demo keeps its Google Fonts links; the automated check supplies an
empty stylesheet for that external request so it can run offline.

A focused fixture in `tests/integration/raw/fixture/` also checks subscriptions,
unsubscription, resize, disposal, remounting, and package asset exports. These
test controls stay outside the public showcase.
