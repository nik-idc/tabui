/** @jest-environment jsdom */

import {
  getEditorFixtures,
  resolveEditorFixture,
  resolveEditorFixtureKey,
} from "../../../demo/raw/data/fixture";
import {
  applyEditorThemeToPage,
  getEditorThemes,
  resolveEditorTheme,
  resolveEditorThemeKey,
} from "../../../demo/raw/data/theme";
import {
  Bar,
  deserializeScore,
  NoteDuration,
  serializeScore,
  VoiceNumber,
} from "../../../src/notation/model";
import showcaseDocument from "../../../fixtures/feature-showcase-score.json";

// Keys are fixture identifiers defined by the demo data contract.
/* eslint-disable @typescript-eslint/naming-convention */
const FIXTURE_EXPECTATIONS = {
  feature_showcase: {
    name: "Sample song",
    tracks: 5,
    bars: 34,
    voicesByTrack: [[[1]], [[1]], [[1]], [[1]], [[1]]],
  },
  empty: { name: "Unknown", tracks: 1, bars: 1, voicesByTrack: [[[1]]] },
  performance_stress: {
    name: "Performance Stress Score",
    tracks: 1,
    bars: 1000,
    voicesByTrack: [[[1]]],
  },
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

const performanceStressTestEnabled =
  process.env.TABUI_RUN_PERFORMANCE_STRESS_TEST === "1";
const fixtures = getEditorFixtures();
const roundTripFixtures = performanceStressTestEnabled
  ? fixtures
  : fixtures.filter((f) => f.key !== "performance_stress");

function requireVoice(bar: Bar, voiceNumber: VoiceNumber) {
  const voice = bar.getVoiceBar(voiceNumber);
  if (voice === null) {
    throw new Error(`Fixture is missing voice ${voiceNumber}`);
  }
  return voice;
}

describe("editor fixture and theme resolution", () => {
  it.each([
    ["feature_showcase", "feature_showcase"],
    ["empty", "empty"],
    ["performance_stress", "performance_stress"],
    ["unknown", "feature_showcase"],
    ["", "feature_showcase"],
  ])("resolves fixture=%s to %s", (key, expected) => {
    const params = new URLSearchParams(key ? `fixture=${key}` : "");

    expect(resolveEditorFixtureKey(params)).toBe(expected);
  });

  it("returns fresh score instances for fixture resolution", () => {
    const emptyParams = new URLSearchParams("fixture=empty");
    expect(resolveEditorFixture(emptyParams)).not.toBe(
      resolveEditorFixture(emptyParams)
    );

    const params = new URLSearchParams("fixture=feature_showcase");
    const firstScore = resolveEditorFixture(params);
    const secondScore = resolveEditorFixture(params);
    const untouched = serializeScore(secondScore);

    // Editing one copy must not change the next one.
    firstScore.masterBars[0].tempo = 87;
    firstScore.tracks[1].name = "Edited track";
    requireVoice(firstScore.tracks[1].staves[0].bars[0], 1).beats[0].makeRest();

    expect(firstScore).not.toBe(secondScore);
    expect(serializeScore(secondScore)).toEqual(untouched);
    expect(serializeScore(firstScore)).not.toEqual(untouched);
  });

  it("exposes fixture options for demo UI", () => {
    expect(fixtures.map((f) => f.key)).toEqual([
      "feature_showcase",
      "empty",
      "performance_stress",
    ]);
  });

  for (const fixture of roundTripFixtures) {
    it(`round trips the ${fixture.key} fixture across a JSON boundary`, () => {
      const source = fixture.createScore();
      const expected = FIXTURE_EXPECTATIONS[fixture.key];
      const document = serializeScore(source);
      const restored = deserializeScore(
        JSON.parse(JSON.stringify(document)) as unknown
      );

      for (const score of [source, restored]) {
        expect(score.name).toBe(expected.name);
        expect(score.tracks).toHaveLength(expected.tracks);
        expect(score.masterBars).toHaveLength(expected.bars);
        for (const [trackIndex, track] of score.tracks.entries()) {
          const voicesByStaff = expected.voicesByTrack[trackIndex];
          expect(track.staves).toHaveLength(voicesByStaff.length);
          for (const [staffIndex, staff] of track.staves.entries()) {
            expect(staff.bars).toHaveLength(expected.bars);
            for (const [barIndex, bar] of staff.bars.entries()) {
              expect(bar.masterBar).toBe(score.masterBars[barIndex]);
              expect(bar.voiceBarsAsArray.map((v) => v.voiceNumber)).toEqual(
                voicesByStaff[staffIndex]
              );
            }
          }
        }
      }
      expect(serializeScore(restored)).toEqual(document);
      if (fixture.key === "performance_stress") {
        for (const barIndex of [0, 499, 999]) {
          const voice = requireVoice(
            restored.tracks[0].staves[0].bars[barIndex],
            1
          );

          expect(voice.beats).toHaveLength(32);
          expect(new Set(voice.beats.map((b) => b.baseDuration))).toEqual(
            new Set([NoteDuration.ThirtySecond])
          );
          expect(voice.beats[31].endTick / voice.tickResolution).toBe(1);
        }
      }
    });
  }

  it("loads the showcase from its saved file, with full bars", () => {
    const score = resolveEditorFixture(new URLSearchParams());
    expect(serializeScore(score)).toEqual(showcaseDocument);
    for (const track of score.tracks) {
      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          for (const voice of bar.voiceBarsAsArray) {
            const last = voice.beats[voice.beats.length - 1];
            expect(last.endTick / voice.tickResolution).toBe(
              bar.masterBar.beatsCount * bar.masterBar.duration
            );
          }
        }
      }
    }
  });

  it("starts the empty fixture with a quarter rest and absent extra voices", () => {
    const score = resolveEditorFixture(new URLSearchParams("fixture=empty"));
    const bar = score.tracks[0].staves[0].bars[0];
    const voice = requireVoice(bar, 1);

    expect(voice.beats).toHaveLength(1);
    expect(voice.beats[0].notes).toBeNull();
    expect(voice.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect([
      bar.getVoiceBar(2),
      bar.getVoiceBar(3),
      bar.getVoiceBar(4),
    ]).toEqual([null, null, null]);
  });

  it.each([
    ["midnight", "midnight"],
    ["obsidian", "obsidian"],
    ["paper", "paper"],
    ["contrast", "contrast"],
    ["light", "light"],
    ["dark", "dark"],
    ["auto", "auto"],
    ["unknown", "auto"],
    ["", "auto"],
  ])("resolves theme=%s to %s", (key, expected) => {
    const params = new URLSearchParams(key ? `theme=${key}` : "");

    expect(resolveEditorThemeKey(params)).toBe(expected);
  });

  it("exposes theme options for demo UI", () => {
    expect(getEditorThemes().map((theme) => theme.key)).toEqual([
      "light",
      "dark",
      "midnight",
      "obsidian",
      "paper",
      "contrast",
    ]);
  });

  it("returns the theme config for the selected key", () => {
    const theme = resolveEditorTheme(new URLSearchParams("theme=paper"));

    expect(theme.assets?.variant).toBe("light");
    expect(theme.theme?.ui?.colors?.background).toBe("#f4efe6");
    expect(theme.theme?.notation?.fonts?.notation).toContain(
      "Cormorant Garamond"
    );
  });

  it("resolves the auto theme from the page appearance", () => {
    const params = new URLSearchParams("theme=auto");

    expect(resolveEditorTheme(params, false).assets?.variant).toBe("light");
    expect(resolveEditorTheme(params, true).assets?.variant).toBe("dark");
  });

  it("applies and replaces page theme CSS without clearing unrelated styles", () => {
    const root = document.documentElement;
    const originalStyle = root.getAttribute("style");
    try {
      root.style.setProperty("--demo-host-color", "tomato");
      applyEditorThemeToPage(
        resolveEditorTheme(new URLSearchParams("theme=paper")),
        root.style
      );

      expect(root.style.getPropertyValue("--tu-background-color")).toBe(
        "#f4efe6"
      );
      expect(root.style.getPropertyValue("--tu-primary-color")).toBe("#fffdf8");
      expect(root.style.getPropertyValue("--tu-secondary-color")).toBe(
        "#ebe2d2"
      );
      expect(root.style.getPropertyValue("--tu-border-color")).toBe("#c8b79c");
      expect(root.style.getPropertyValue("--tu-font-color")).toBe("#433422");

      applyEditorThemeToPage(
        resolveEditorTheme(new URLSearchParams("theme=midnight"))
      );

      expect(root.style.getPropertyValue("--tu-background-color")).toBe(
        "#0f172a"
      );
      expect(root.style.getPropertyValue("--tu-primary-color")).toBe("#111827");
      expect(root.style.getPropertyValue("--tu-secondary-color")).toBe(
        "#1f2937"
      );
      expect(root.style.getPropertyValue("--tu-border-color")).toBe("#334155");
      expect(root.style.getPropertyValue("--tu-font-color")).toBe("#e5eefb");
      expect(root.style.getPropertyValue("--demo-host-color")).toBe("tomato");
    } finally {
      if (originalStyle === null) {
        root.removeAttribute("style");
      } else {
        root.setAttribute("style", originalStyle);
      }
    }
  });
});
