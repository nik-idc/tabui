# Raw demo

This is the TabUI showcase as a plain TypeScript page, without a UI framework.
The website's [demo page](https://nik-idc.github.io/tabui/demo) runs the same
code inside VitePress.

- `demo-app.ts` renders the controls and the editor into a host element. Both
  this page and `docs/demo.md` call its `mountDemo` function.
- `demo-template.ts` holds the controls markup, and `demo-app.css` their styles.
  The host page sets the `--demo-*` colors.
- `main.ts` mounts the demo into `index.html` and colors the page with the
  selected editor theme.

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

The output is `demo/dist/`. Sample audio comes from `assets/samples/`; samples
are demo resources and do not ship in the npm package.

Every setting is stored in the URL, so a link keeps it. Changing a setting
remounts the editor with the current score. Changing the score fixture loads a
new score.

The **Theme** setting defaults to **Auto**, which uses the **Light** or **Dark**
theme to match the page: the system setting here, or the site's light/dark
toggle on the website.

Use **Sound** to compare **FluidR3** (the default pack), **Free Wave Samples**,
and **Synth** (built-in oscillator tones). The choice is stored as
`soundSource=fluidr3`, `soundSource=samples`, or `soundSource=synths`. Synth mode
does not load samples; all sources use the same playback scheduling and
techniques.

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

A focused fixture in `tests/integration/raw/fixture/` also checks subscriptions,
unsubscription, resize, disposal, remounting, and package asset exports. These
test controls stay outside the public showcase.
