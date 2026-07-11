import { resolveTabUIConfig } from "../../src/config/tabui-config";
import { ElectricGuitarTone, NoteValue } from "../../src/notation/model";

describe("tabui-config", () => {
  it("fills defaults for empty config", () => {
    const config = resolveTabUIConfig();

    expect(config.assets.baseUrl).toBe("");
    expect(config.assets.variant).toBe("light");
    expect(config.theme.cssVars["--tu-background-color"]).toBe("#f0f0f0");
    expect(config.theme.cssVars["--tu-font-body"]).toContain("Segoe UI");
    expect(config.theme.cssVars["--tu-font-notation"]).toContain("Roboto");
    expect(config.theme.cssVars["--tu-notation-ink"]).toBe("#000000");
  });

  it("merges partial overrides into css vars", () => {
    const config = resolveTabUIConfig({
      assets: {
        baseUrl: "/tabui/",
        variant: "dark",
      },
      theme: {
        ui: {
          colors: {
            background: "#111111",
            text: "#eeeeee",
          },
          fonts: {
            body: "Inter, sans-serif",
          },
          radius: "12px",
        },
        notation: {
          colors: {
            ink: "#f8fafc",
            noteBackground: "#020617",
          },
          fonts: {
            notation: "Bravura, serif",
          },
        },
      },
    });

    expect(config.assets.baseUrl).toBe("/tabui");
    expect(config.assets.variant).toBe("dark");
    expect(config.theme.cssVars["--tu-background-color"]).toBe("#111111");
    expect(config.theme.cssVars["--tu-font-color"]).toBe("#eeeeee");
    expect(config.theme.cssVars["--tu-font-body"]).toBe("Inter, sans-serif");
    expect(config.theme.cssVars["--tu-font-notation"]).toBe("Bravura, serif");
    expect(config.theme.cssVars["--tu-border-radius"]).toBe("12px");
    expect(config.theme.cssVars["--tu-notation-ink"]).toBe("#f8fafc");
    expect(config.theme.cssVars["--tu-notation-note-background"]).toBe(
      "#020617"
    );
  });

  it("resolves playback samples by instrument tone", () => {
    const config = resolveTabUIConfig({
      playback: {
        [ElectricGuitarTone.Clean]: {
          url: "/samples/clean.wav",
          rootNote: {
            noteValue: NoteValue.C,
            octave: 3,
          },
        },
      },
    });

    expect(config.playback[ElectricGuitarTone.Clean]).toEqual({
      url: "/samples/clean.wav",
      rootFrequency: 130.8127826502993,
    });
  });
});
