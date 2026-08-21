import {
  getEditorFixtures,
  resolveEditorFixture,
  resolveEditorFixtureKey,
} from "../../../demo/data/fixture";
import {
  applyEditorThemeToPage,
  getEditorThemes,
  resolveEditorTheme,
  resolveEditorThemeKey,
} from "../../../demo/data/theme";
import { deserializeScore, serializeScore } from "../../../src/notation/model";

const FIXTURE_SCORE_NAMES = {
  feature_showcase: "Feature Showcase Score",
  empty: "Unknown",
  performance_stress: "Performance Stress Score",
  multi_voice_single_staff: "Multi Voice Single Staff",
  multi_voice_two_staff: "Multi Voice Two Staff",
} as const;

describe("editor fixture and theme resolution", () => {
  it("resolves known fixture keys and falls back to default", () => {
    expect(
      resolveEditorFixtureKey(new URLSearchParams("fixture=performance_stress"))
    ).toBe("performance_stress");
    expect(
      resolveEditorFixtureKey(new URLSearchParams("fixture=unknown"))
    ).toBe("feature_showcase");
    expect(resolveEditorFixtureKey(new URLSearchParams())).toBe(
      "feature_showcase"
    );
  });

  it("returns fresh score instances for fixture resolution", () => {
    const firstScore = resolveEditorFixture(
      new URLSearchParams("fixture=empty")
    );
    const secondScore = resolveEditorFixture(
      new URLSearchParams("fixture=empty")
    );

    expect(firstScore).not.toBe(secondScore);
  });

  it("exposes fixture options for demo UI", () => {
    expect(getEditorFixtures().map((fixture) => fixture.key)).toEqual([
      "feature_showcase",
      "empty",
      "performance_stress",
      "multi_voice_single_staff",
      "multi_voice_two_staff",
    ]);
  });

  for (const fixture of getEditorFixtures()) {
    it(`round trips the ${fixture.key} fixture across a JSON boundary`, () => {
      const source = fixture.createScore();
      const sourceTrackCount = source.tracks.length;
      const sourceMasterBarCount = source.masterBars.length;
      const document = serializeScore(source);
      const restored = deserializeScore(
        JSON.parse(JSON.stringify(document)) as unknown
      );

      expect(source.name).toBe(FIXTURE_SCORE_NAMES[fixture.key]);
      expect(restored.name).toBe(FIXTURE_SCORE_NAMES[fixture.key]);
      expect(restored.tracks).toHaveLength(sourceTrackCount);
      expect(restored.masterBars).toHaveLength(sourceMasterBarCount);
      expect(serializeScore(restored)).toEqual(document);

      if (fixture.key === "performance_stress") {
        expect(sourceMasterBarCount).toBe(1000);
      }

      if (fixture.key === "multi_voice_two_staff") {
        expect(source.tracks[0].staves).toHaveLength(2);
        expect(restored.tracks[0].staves).toHaveLength(2);
        expect(restored.tracks[0].staves[0].bars[0].getVoiceBar(2)).not.toBe(
          undefined
        );
        expect(restored.tracks[0].staves[1].bars[0].getVoiceBar(3)).not.toBe(
          undefined
        );
      }
    });
  }

  it("resolves known theme keys and falls back to obsidian", () => {
    expect(resolveEditorThemeKey(new URLSearchParams("theme=midnight"))).toBe(
      "midnight"
    );
    expect(resolveEditorThemeKey(new URLSearchParams("theme=unknown"))).toBe(
      "obsidian"
    );
    expect(resolveEditorThemeKey(new URLSearchParams())).toBe("obsidian");
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

  it("applies the selected theme to demo-owned page chrome", () => {
    const style = { setProperty: jest.fn() };
    const theme = resolveEditorTheme(new URLSearchParams("theme=paper"));

    applyEditorThemeToPage(theme, style);

    expect(style.setProperty).toHaveBeenCalledWith(
      "--tu-background-color",
      "#f4efe6"
    );
    expect(style.setProperty).toHaveBeenCalledWith(
      "--tu-primary-color",
      "#fffdf8"
    );
    expect(style.setProperty).not.toHaveBeenCalledWith(
      "--tu-background-color",
      "#0f172a"
    );
  });
});
