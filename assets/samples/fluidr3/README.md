# FluidR3 demo samples

This pack is the demo default, separate from the existing Free Wave Samples pack.
Choose **FluidR3** in the sound-source control, or use `?soundSource=fluidr3`.
These demo assets do not ship in the npm package.

## Source and license

Fluid (R3) SoundFont, copyright 2000–2002, 2008 Frank Wen and contributors.
The original [COPYING](COPYING) and [source README](SOURCE-README) are retained.
The MIT license permits modified samples, public redistribution, and self-hosting.
Keep the copyright and permission notice with redistributed copies.

- [Source bank](https://github.com/pianobooster/fluid-soundfont/releases/download/v3.1/FluidR3_GM.sf2)
  (148,398,306 bytes; the mirror's release tag is v3.1, the bank is Fluid R3).
- [Original license](https://raw.githubusercontent.com/pianobooster/fluid-soundfont/main/COPYING)
- [Author's release and provenance statement](https://raw.githubusercontent.com/pianobooster/fluid-soundfont/main/README)
- Bank SHA-256: `74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0`.
- Original license SHA-256: `8ef830b65c97a976b86e34bb5fde08d99dfb1db13c4149b5b20bc837ac6c4568`.

## Preparation

Requires Python 3.9 or newer, standard library only. Download the bank above,
then run from the repository root:

```sh
python3 assets/samples/fluidr3/scripts/extract-samples.py /path/to/FluidR3_GM.sf2
python3 assets/samples/fluidr3/scripts/test_samples.py
```

The script rejects other banks and checks the retained license before writing.
It does not download or execute third-party code. The large SF2 is not retained
in this repository. [manifest.json](manifest.json) records every output hash,
size, source zone, root override, pitch correction, and loop boundary.

| Tone               | Source sample name | Effective MIDI root | SF2 fine tune |
| ------------------ | ------------------ | ------------------- | ------------- |
| Clean electric     | Clean F50          | 59 (B3)             | −15 cents     |
| Overdrive electric | Distortion B4      | 59 (B3)             | +5 cents      |
| Distorted electric | Distortion B0      | 59 (B3)             | −2 cents      |
| Nylon acoustic     | Nylon B4           | 59 (B3)             | −3 cents      |
| Steel acoustic     | Steel B4           | 59 (B3)             | 0 cents       |
| Fingered bass      | Finger Bass A3     | 36 (C2)             | 0 cents       |

Names such as “B4” are source labels, not the playback roots. These sample
headers all say MIDI 60; the instrument zones override that value. The extractor
applies the zone fine tuning by adjusting the integer WAV sample rate. PCM and
loop frames stay unchanged; rate rounding introduces less than 0.04 cent of error.
The demo config uses the corrected nominal root notes above.

Each file contains mono 16-bit PCM, its original forward sustain loop translated
to WAV `smpl` metadata, and no unused post-loop tail. SF2 uses exclusive loop ends;
WAV uses inclusive ends. The script converts between them. Original pre-loop
attacks and decays remain unchanged. It does not synthesize a new sustain region,
add vibrato, crossfade, normalize, or repeat the attack.

## Checks and limits

The script checks source bounds, continuous-loop mode, mono PCM, loop energy,
and boundary steps. Each seam is less than twice the RMS of adjacent sample
steps within its loop. Tests check the real WAVs, hashes, roots, and pitch-rate
corrections. The raw integration test checks the demo's sound-source controls.
These checks do not replace listening.

This is a single-sample-per-tone comparison pack, not full FluidR3 playback.
The electric instruments have duplicate filtered layers; the extractor takes
the first PCM layer only. Preset velocity-dependent envelopes, filters,
modulators, effects, and instrument envelopes are not rendered. TabUI supplies
its own note shaping. Natural recorded decay can leave the loop quiet, especially
for acoustic guitars. Large pitch shifts can still change the timbre or expose
loop texture; this pack does not add multisampling or guarantee realistic sustain.
