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
import { deserializeScore, serializeScore } from "../../../src/notation/model";

// Keys are fixture identifiers defined by the demo data contract.
/* eslint-disable @typescript-eslint/naming-convention */
const FIXTURE_EXPECTATIONS = {
  feature_showcase: {
    name: "Feature Showcase Score",
    tracks: 3,
    bars: 6,
    voicesByStaff: [[1], [1]],
  },
  empty: { name: "Unknown", tracks: 1, bars: 1, voicesByStaff: [[1]] },
  performance_stress: {
    name: "Performance Stress Score",
    tracks: 1,
    bars: 1000,
    voicesByStaff: [[1]],
  },
  multi_voice_single_staff: {
    name: "Multi Voice Single Staff",
    tracks: 1,
    bars: 3,
    voicesByStaff: [[1, 2]],
  },
  multi_voice_two_staff: {
    name: "Multi Voice Two Staff",
    tracks: 1,
    bars: 3,
    voicesByStaff: [
      [1, 2],
      [1, 3],
    ],
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

function guitarNotes(beat: Beat): GuitarNote[] {
  if (beat.notes === null) {
    throw new Error("Expected fixture notes, received a rest");
  }
  return beat.notes.map((n) => {
    if (!(n instanceof GuitarNote)) {
      throw new Error("Expected a guitar note in the fixture");
    }
    return n;
  });
}

describe("editor fixture and theme resolution", () => {
  it.each([
    ["feature_showcase", "feature_showcase"],
    ["empty", "empty"],
    ["performance_stress", "performance_stress"],
    ["multi_voice_single_staff", "multi_voice_single_staff"],
    ["multi_voice_two_staff", "multi_voice_two_staff"],
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
    const firstLead = requireVoice(firstScore.tracks[1].staves[0].bars[0], 1);
    const secondLead = requireVoice(secondScore.tracks[1].staves[0].bars[0], 1);

    firstScore.masterBars[0].tempo = 87;
    firstScore.tracks[1].name = "Edited lead";
    guitarNotes(firstLead.beats[0])[0].fret = 7;

    expect(firstScore).not.toBe(secondScore);
    expect(secondScore.masterBars[0].tempo).toBe(120);
    expect(secondScore.tracks[1].name).toBe("Lead track");
    expect(guitarNotes(secondLead.beats[0])[0].fret).toBe(12);
  });

  it("exposes fixture options for demo UI", () => {
    expect(fixtures.map((f) => f.key)).toEqual([
      "feature_showcase",
      "empty",
      "performance_stress",
      "multi_voice_single_staff",
      "multi_voice_two_staff",
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
        for (const track of score.tracks) {
          expect(track.staves).toHaveLength(expected.voicesByStaff.length);
          for (const [staffIndex, staff] of track.staves.entries()) {
            expect(staff.bars).toHaveLength(expected.bars);
            for (const [barIndex, bar] of staff.bars.entries()) {
              expect(bar.masterBar).toBe(score.masterBars[barIndex]);
              expect(bar.voiceBarsAsArray.map((v) => v.voiceNumber)).toEqual(
                expected.voicesByStaff[staffIndex]
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

  it("provides distinct chord, lead and bass parts in the showcase", () => {
    const score = resolveEditorFixture(new URLSearchParams());
    const parts = score.tracks.map((t) => {
      const voice = requireVoice(t.staves[0].bars[0], 1);
      return guitarNotes(voice.beats[0]).map((n) => n.fret);
    });

    expect(parts).toEqual([
      [null, 2, 2, 1, null, null],
      [12, null, null, null, null, null],
      [null, null, null, 0],
    ]);
    const rhythmBars = score.tracks[0].staves[0].bars;
    expect(rhythmBars.map((b) => requireVoice(b, 1).beats.length)).toEqual([
      1, 2, 4, 8, 16, 32,
    ]);
    expect(
      rhythmBars.map((b) => requireVoice(b, 1).beats[0].baseDuration)
    ).toEqual([
      NoteDuration.Whole,
      NoteDuration.Half,
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.ThirtySecond,
    ]);
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

  it.each(["multi_voice_single_staff", "multi_voice_two_staff"])(
    "provides independent dotted and tuplet voice timing in %s",
    (key) => {
      const score = resolveEditorFixture(new URLSearchParams(`fixture=${key}`));
      const bars = score.tracks[0].staves[0].bars;
      const melody = requireVoice(bars[0], 1);
      const accompaniment = requireVoice(bars[0], 2);
      const triplets = requireVoice(bars[2], 1);

      expect(
        melody.beats.map((b) => b.startTick / melody.tickResolution)
      ).toEqual([0, 0.25, 0.5, 0.75]);
      expect(
        accompaniment.beats.map((b) => [
          b.dots,
          b.startTick / accompaniment.tickResolution,
          b.endTick / accompaniment.tickResolution,
        ])
      ).toEqual([
        [0, 0, 0.5],
        [1, 0.5, 0.875],
        [0, 0.875, 1],
      ]);
      expect(triplets.beats.map((b) => b.tupletSettings)).toEqual([
        { normalCount: 3, tupletCount: 2 },
        { normalCount: 3, tupletCount: 2 },
        { normalCount: 3, tupletCount: 2 },
        null,
      ]);
      expect(
        triplets.beats.map((b) => b.endTick / triplets.tickResolution)
      ).toEqual([1 / 12, 1 / 6, 0.25, 0.75]);
      expect(accompaniment.beats.map((b) => guitarNotes(b)[2].fret)).toEqual([
        2, 4, 5,
      ]);
    }
  );

  it("populates voice three on the second staff with a separate bass line", () => {
    const score = resolveEditorFixture(
      new URLSearchParams("fixture=multi_voice_two_staff")
    );
    const bar = score.tracks[0].staves[1].bars[0];
    const bass = requireVoice(bar, 3);

    expect(bass.beats.map((b) => guitarNotes(b)[4].fret)).toEqual([
      0, 2, 3, 5, 7,
    ]);
    expect(bass.beats.map((b) => b.startTick / bass.tickResolution)).toEqual([
      0, 0.125, 0.25, 0.375, 0.5,
    ]);
    expect(
      requireVoice(bar, 1).beats.map((b) => guitarNotes(b)[1].fret)
    ).toEqual([5, 7]);
    expect(bar.getVoiceBar(2)).toBeNull();
  });

  it.each([
    ["midnight", "midnight"],
    ["obsidian", "obsidian"],
    ["paper", "paper"],
    ["contrast", "contrast"],
    ["unknown", "obsidian"],
    ["", "obsidian"],
  ])("resolves theme=%s to %s", (key, expected) => {
    const params = new URLSearchParams(key ? `theme=${key}` : "");

    expect(resolveEditorThemeKey(params)).toBe(expected);
  });

  it("exposes theme options for demo UI", () => {
    expect(getEditorThemes().map((theme) => theme.key)).toEqual([
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
      expect(root.style.getPropertyValue("--tu-font-body")).toBe(
        '"Merriweather", serif'
      );
      expect(root.style.getPropertyValue("--tu-notation-ink")).toBe("#433422");

      applyEditorThemeToPage(
        resolveEditorTheme(new URLSearchParams("theme=midnight"))
      );

      expect(root.style.getPropertyValue("--tu-background-color")).toBe(
        "#0f172a"
      );
      expect(root.style.getPropertyValue("--tu-primary-color")).toBe("#111827");
      expect(root.style.getPropertyValue("--tu-font-body")).toBe(
        '"Inter", sans-serif'
      );
      expect(root.style.getPropertyValue("--tu-notation-ink")).toBe("#e5eefb");
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
