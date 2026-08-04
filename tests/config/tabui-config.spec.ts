import {
  TabUIEditorMode,
  TabUIScorePanelPlacement,
  TabUISidePanelPlacement,
  resolveTabUIConfig,
} from "../../src/config/tabui-config";
import { ElectricGuitarTone, NoteValue } from "../../src/notation/model";

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
      width: undefined,
      minWidth: 320,
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

  it("resolves layout overrides", () => {
    const config = resolveTabUIConfig({
      layout: {
        width: 720,
        minWidth: 400,
        noteTextSize: 16,
        timeSigTextSize: 50,
        tempoTextSize: 28,
        durationsHeight: 36,
        horizontalPadding: 18,
      },
    });

    expect(config.layout).toEqual({
      width: 720,
      minWidth: 400,
      noteTextSize: 16,
      timeSigTextSize: 50,
      tempoTextSize: 28,
      durationsHeight: 36,
      horizontalPadding: 18,
    });
  });

  it("hides the editing side panel by default in view-only mode", () => {
    const config = resolveTabUIConfig({
      interaction: { mode: TabUIEditorMode.ViewOnly },
    });

    expect(config.interaction.mode).toBe(TabUIEditorMode.ViewOnly);
    expect(config.panels.score.visible).toBe(true);
    expect(config.panels.side.visible).toBe(false);
  });

  it("resolves explicit panel visibility and placement", () => {
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
        visible: true,
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
