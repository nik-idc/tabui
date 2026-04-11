import {
  getEditorFixtures,
  resolveEditorFixture,
  resolveEditorFixtureKey,
} from "../../editor/data/fixture";
import {
  getEditorThemes,
  resolveEditorTheme,
  resolveEditorThemeKey,
} from "../../editor/data/theme";

describe("editor fixture and theme resolution", () => {
  it("resolves known fixture keys and falls back to default", () => {
    expect(
      resolveEditorFixtureKey(new URLSearchParams("fixture=selection_perf"))
    ).toBe("selection_perf");
    expect(
      resolveEditorFixtureKey(new URLSearchParams("fixture=unknown"))
    ).toBe("default");
    expect(resolveEditorFixtureKey(new URLSearchParams())).toBe("default");
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
      "default",
      "empty",
      "selection_perf",
    ]);
  });

  it("resolves known theme keys and falls back to default", () => {
    expect(resolveEditorThemeKey(new URLSearchParams("theme=midnight"))).toBe(
      "midnight"
    );
    expect(resolveEditorThemeKey(new URLSearchParams("theme=unknown"))).toBe(
      "default"
    );
    expect(resolveEditorThemeKey(new URLSearchParams())).toBe("default");
  });

  it("exposes theme options for demo UI", () => {
    expect(getEditorThemes().map((theme) => theme.key)).toEqual([
      "default",
      "midnight",
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
});
