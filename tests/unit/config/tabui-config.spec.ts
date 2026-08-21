import {
  TabUIEditorMode,
  TabUILayoutMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
  resolveTabUIConfig,
} from "../../../src/config/tabui-config";
import { ElectricGuitarTone, NoteValue } from "../../../src/notation/model";

describe("tabui-config", () => {
  it("fills defaults for empty config", () => {
    const config = resolveTabUIConfig();

    expect(config.assets.baseUrl).toBe("");
    expect(config.assets.variant).toBe("light");
    expect(config.interaction.mode).toBe(TabUIEditorMode.Edit);
    expect(config.panels).toEqual({
      score: {
        visible: true,
        placement: TabUIScorePanelPlacement.Top,
      },
      side: {
        visible: true,
        placement: TabUISidePanelPlacement.Left,
        collapsible: true,
        initiallyCollapsed: false,
      },
    });
    expect(config.theme.cssVars["--tu-background-color"]).toBe("#f0f0f0");
    expect(config.theme.cssVars["--tu-font-body"]).toContain("Segoe UI");
    expect(config.theme.cssVars["--tu-font-notation"]).toContain("Roboto");
    expect(config.theme.cssVars["--tu-notation-ink"]).toBe("#000000");
    expect(config.layout).toEqual({
      mode: TabUILayoutMode.Wrapped,
      width: undefined,
      viewOnlyModeWidthThreshold: 500,
      unrestrictedModeWidthThreshold: 1000,
      noteTextSize: 12,
      timeSigTextSize: 48,
      tempoTextSize: 24,
      durationsHeight: 30,
      horizontalPadding: 12,
    });
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

  it("merges combined layout overrides", () => {
    const config = resolveTabUIConfig({
      layout: {
        mode: TabUILayoutMode.SingleLine,
        width: 720,
        viewOnlyModeWidthThreshold: 600,
        unrestrictedModeWidthThreshold: 1200,
        noteTextSize: 16,
        timeSigTextSize: 50,
        tempoTextSize: 28,
        durationsHeight: 36,
        horizontalPadding: 18,
      },
    });

    expect(config.layout).toEqual({
      mode: TabUILayoutMode.SingleLine,
      width: 720,
      viewOnlyModeWidthThreshold: 600,
      unrestrictedModeWidthThreshold: 1200,
      noteTextSize: 16,
      timeSigTextSize: 50,
      tempoTextSize: 28,
      durationsHeight: 36,
      horizontalPadding: 18,
    });
  });

  it("resolves playback samples by instrument tone", () => {
    const config = resolveTabUIConfig({
      playback: {
        preloadAudio: true,
        samples: {
          [ElectricGuitarTone.Clean]: {
            url: "/samples/clean.wav",
            rootNote: {
              noteValue: NoteValue.C,
              octave: 3,
            },
          },
        },
      },
    });

    expect(config.playback.samples[ElectricGuitarTone.Clean]).toEqual({
      url: "/samples/clean.wav",
      rootFrequency: 130.8127826502993,
    });
    expect(config.playback.preloadAudio).toBe(true);
  });

  it("rejects invalid responsive layout thresholds", () => {
    expect(() =>
      resolveTabUIConfig({
        layout: {
          viewOnlyModeWidthThreshold: 900,
          unrestrictedModeWidthThreshold: 900,
        },
      })
    ).toThrow("layout thresholds");
  });

  it("rejects fixed widths that cannot fit view-only notation", () => {
    expect(() => resolveTabUIConfig({ layout: { width: 499 } })).toThrow(
      "layout width"
    );
    expect(() => resolveTabUIConfig({ layout: { width: Infinity } })).toThrow(
      "layout width"
    );
  });

  it("rejects an invalid layout mode at the runtime boundary", () => {
    const config = { layout: {} };
    Reflect.set(config.layout, "mode", "invalid");

    expect(() => resolveTabUIConfig(config)).toThrow("layout mode");
  });

  it("rejects an invalid interaction mode at the runtime boundary", () => {
    const config = { interaction: {} };
    Reflect.set(config.interaction, "mode", "invalid");

    expect(() => resolveTabUIConfig(config)).toThrow("interaction mode");
  });

  it("rejects an invalid asset variant at the runtime boundary", () => {
    const config = { assets: {} };
    Reflect.set(config.assets, "variant", "invalid");

    expect(() => resolveTabUIConfig(config)).toThrow("asset variant");
  });

  it("rejects invalid panel placements at the runtime boundary", () => {
    const scoreConfig = { panels: { score: {} } };
    Reflect.set(scoreConfig.panels.score, "placement", "invalid");
    const sideConfig = { panels: { side: {} } };
    Reflect.set(sideConfig.panels.side, "placement", "invalid");

    expect(() => resolveTabUIConfig(scoreConfig)).toThrow("score panel");
    expect(() => resolveTabUIConfig(sideConfig)).toThrow("side panel");
  });

  it.each([
    "noteTextSize",
    "timeSigTextSize",
    "tempoTextSize",
    "durationsHeight",
  ])("rejects a non-positive %s", (name) => {
    const layout = {};
    Reflect.set(layout, name, 0);

    expect(() => resolveTabUIConfig({ layout })).toThrow(name);
  });

  it.each([
    "noteTextSize",
    "timeSigTextSize",
    "tempoTextSize",
    "durationsHeight",
    "horizontalPadding",
  ])("rejects a non-finite %s", (name) => {
    const layout = {};
    Reflect.set(layout, name, NaN);

    expect(() => resolveTabUIConfig({ layout })).toThrow(name);
  });

  it("rejects negative horizontal padding", () => {
    const layout = {};
    Reflect.set(layout, "horizontalPadding", -1);

    expect(() => resolveTabUIConfig({ layout })).toThrow("horizontalPadding");
  });

  it("rejects an unknown playback sample tone", () => {
    const samples = {};
    Reflect.set(samples, "Unknown tone", { url: "/samples/unknown.wav" });

    expect(() => resolveTabUIConfig({ playback: { samples } })).toThrow(
      "sample tone"
    );
  });

  it.each([null, [], "sample"])(
    "rejects a non-object playback sample entry: %p",
    (sample) => {
      const samples = {};
      Reflect.set(samples, ElectricGuitarTone.Clean, sample);

      expect(() => resolveTabUIConfig({ playback: { samples } })).toThrow(
        "sample config must be an object"
      );
    }
  );

  it.each([undefined, null, 42, {}])(
    "rejects a playback sample with an invalid URL: %p",
    (url) => {
      const samples = {};
      Reflect.set(samples, ElectricGuitarTone.Clean, { url });

      expect(() => resolveTabUIConfig({ playback: { samples } })).toThrow(
        "sample URL must be a string"
      );
    }
  );

  it("hides the editing side panel by default in view-only mode", () => {
    const config = resolveTabUIConfig({
      interaction: { mode: TabUIEditorMode.ViewOnly },
    });

    expect(config.interaction.mode).toBe(TabUIEditorMode.ViewOnly);
    expect(config.panels.score.visible).toBe(true);
    expect(config.panels.side.visible).toBe(false);
  });

  it("omits the editing side panel in view-only mode", () => {
    const config = resolveTabUIConfig({
      interaction: { mode: TabUIEditorMode.ViewOnly },
      panels: {
        score: {
          visible: false,
          placement: TabUIScorePanelPlacement.Bottom,
        },
        side: {
          visible: true,
          placement: TabUISidePanelPlacement.Right,
          collapsible: false,
          initiallyCollapsed: true,
        },
      },
    });

    expect(config.panels).toEqual({
      score: {
        visible: false,
        placement: TabUIScorePanelPlacement.Bottom,
      },
      side: {
        visible: false,
        placement: TabUISidePanelPlacement.Right,
        collapsible: false,
        initiallyCollapsed: false,
      },
    });
  });

  it("resolves an initially collapsed side panel when collapsible", () => {
    const config = resolveTabUIConfig({
      panels: {
        side: { initiallyCollapsed: true },
      },
    });

    expect(config.panels.side.collapsible).toBe(true);
    expect(config.panels.side.initiallyCollapsed).toBe(true);
  });
});
