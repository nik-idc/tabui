import {
  InstrumentTone,
  NoteType,
  NoteValue,
  STRING_TONES,
  getFrequencyFromNoteType,
} from "../notation/model";

/** Sample recording used for a playback tone; omitted tones use synthesized audio. */
export interface PlaybackSampleConfig {
  /** Audio URL fetched and decoded for playback. */
  url: string;
  /**
   * Recorded sample pitch, default E2; converted to Hz to set playbackRate for other notes.
   * Use the recording's actual pitch. Tones without a sample use synthesized audio.
   */
  rootNote?: NoteType;
}

/** Optional sample recordings keyed by instrument tone. */
export type PlaybackSampleConfigs = Partial<
  Record<InstrumentTone, PlaybackSampleConfig>
>;

/** Playback preparation and per-tone samples supplied at editor construction. */
export interface PlaybackConfig {
  /** Starts background preparation of audio and score samples during initialization; defaults to false, preparing on playback instead. */
  preloadAudio?: boolean;
  /** Sample configuration keyed by instrument tone. */
  samples?: PlaybackSampleConfigs;
}

/** Sample URL and recorded pitch after resolving the input root note (E2 by default). */
export interface ResolvedPlaybackSampleConfig {
  /** Audio URL fetched and decoded for playback. */
  url: string;
  /** Recorded sample pitch in Hz, resolved from rootNote (E2 by default). */
  rootFrequency: number;
}

/** Resolved per-tone samples; absent tones use synthesized audio. */
export type ResolvedPlaybackSampleConfigs = Partial<
  Record<InstrumentTone, ResolvedPlaybackSampleConfig>
>;

/** Playback settings after applying construction-time defaults. */
export interface ResolvedPlaybackConfig {
  /** Whether initialization prepares samples; defaults to false. */
  preloadAudio: boolean;
  /** Sample URLs and recorded root frequencies keyed by tone. */
  samples: ResolvedPlaybackSampleConfigs;
}

/** Selects interactive editing or read-only score viewing. */
export enum TabUIEditorMode {
  Edit = "edit",
  ViewOnly = "view-only",
}

/** Controls whether score bars wrap to the available notation width. */
export enum TabUILayoutMode {
  Wrapped = "wrapped",
  SingleLine = "single-line",
}

/** Places the score controls above or below the notation. */
export enum TabUIScorePanelPlacement {
  Top = "top",
  Bottom = "bottom",
}

/** Places editing controls to the left or right of the notation. */
export enum TabUISidePanelPlacement {
  Left = "left",
  Right = "right",
}

/** Optional construction-time editor settings; omitted values use built-in defaults. */
export interface TabUIConfig {
  /** Icon source and color variant. */
  assets?: {
    /** Optional public icon folder URL. Omit or leave empty to use bundled icons. */
    baseUrl?: string;
    /** Selects the light (default) or dark icon set. */
    variant?: "light" | "dark";
  };
  /** Editing permission applied when constructing the editor. */
  interaction?: {
    /** Edit by default; ViewOnly hides editing controls. */
    mode?: TabUIEditorMode;
  };
  /** Notation geometry and responsive widths, measured in CSS pixels. */
  layout?: {
    /** Wrapped by default; SingleLine keeps bars on one horizontal line. */
    mode?: TabUILayoutMode;
    /** Finite fixed width at least the view-only threshold; omit to measure the host. */
    width?: number;
    /** Minimum viewport width before an auto-width editor is blocked; finite and non-negative, default 500. */
    viewOnlyModeWidthThreshold?: number;
    /** Minimum viewport width for editing in auto-width mode; finite and greater than the view-only threshold, default 1000. */
    unrestrictedModeWidthThreshold?: number;
    /** Positive finite fret-text font size; defaults to 12. */
    noteTextSize?: number;
    /** Positive finite time-signature font size; defaults to 48. */
    timeSigTextSize?: number;
    /** Positive finite tempo-label font size; defaults to 24. */
    tempoTextSize?: number;
    /** Positive finite duration-symbol height; defaults to 30. */
    durationsHeight?: number;
    /** Finite non-negative margin on each horizontal side; defaults to 12. */
    horizontalPadding?: number;
  };
  /** Sample preparation and playback sources. */
  playback?: PlaybackConfig;
  /** Visibility and placement of the score and editing controls. */
  panels?: {
    /** Score-wide controls, visible at the top by default. */
    score?: {
      /** Whether to display score controls; defaults to true. */
      visible?: boolean;
      /** Defaults to Top. */
      placement?: TabUIScorePanelPlacement;
    };
    /** Editing controls, visible on the left in Edit mode by default. */
    side?: {
      /** Defaults to true; ViewOnly mode always hides this panel. */
      visible?: boolean;
      /** Defaults to Left. */
      placement?: TabUISidePanelPlacement;
      /** Whether the user can collapse the panel; defaults to true. */
      collapsible?: boolean;
      /** Starts collapsed only when collapsible; defaults to false. */
      initiallyCollapsed?: boolean;
    };
  };
  /** CSS color, font-family, and border-radius values overriding the built-in theme. */
  theme?: {
    /** Host interface theme, including controls and panels. */
    ui?: {
      /** CSS colors for interface surfaces and interaction states. */
      colors?: {
        /** Editor background. */
        background?: string;
        /** Primary control and panel surface. */
        surface?: string;
        /** Secondary surface. */
        surfaceAlt?: string;
        /** Control borders and bend-editor grid. */
        border?: string;
        /** Interface text and bend-editor labels. */
        text?: string;
        /** Hovered control background. */
        hover?: string;
        /** Active or applied control background. */
        applied?: string;
      };
      /** CSS font-family values for interface text. */
      fonts?: {
        /** Body and control font family. */
        body?: string;
      };
      /** CSS border-radius value for controls and panels. */
      radius?: string;
    };
    /** SVG notation and note-selection theme. */
    notation?: {
      /** CSS colors for notation and editing overlays. */
      colors?: {
        /** Notation strokes and bend-editor curves and handles. */
        ink?: string;
        /** Notation labels and fret text. */
        text?: string;
        /** Background behind fret numbers. */
        noteBackground?: string;
        /** Selection outline. */
        selectionStroke?: string;
        /** Selection fill, including block selection. */
        selectionFill?: string;
        /** Editing cursor. */
        cursor?: string;
        /** Invalid-content indicators. */
        danger?: string;
      };
      /** CSS font-family values used in notation. */
      fonts?: {
        /** Font family for rendered notation text. */
        notation?: string;
      };
    };
  };
}

/** Construction-time settings after defaults and validation; width may remain automatic. */
export interface ResolvedTabUIConfig {
  /** Resolved icon source and variant. */
  assets: {
    /** Normalized icon folder URL; empty means bundled icons. */
    baseUrl: string;
    /** Icon color set. */
    variant: "light" | "dark";
  };
  /** Requested editing mode, before responsive width restrictions. */
  interaction: {
    /** Editing or view-only permission. */
    mode: TabUIEditorMode;
  };
  /** Validated notation geometry, in CSS pixels. */
  layout: {
    /** Wrapped bars or a single horizontal line. */
    mode: TabUILayoutMode;
    /** Fixed width; undefined means measure the host. */
    width?: number;
    /** Minimum viewport width for view-only interaction in auto-width mode. */
    viewOnlyModeWidthThreshold: number;
    /** Minimum viewport width for editing in auto-width mode. */
    unrestrictedModeWidthThreshold: number;
    /** Fret-text font size. */
    noteTextSize: number;
    /** Time-signature font size. */
    timeSigTextSize: number;
    /** Tempo-label font size. */
    tempoTextSize: number;
    /** Reserved duration-symbol height. */
    durationsHeight: number;
    /** Margin on each horizontal side. */
    horizontalPadding: number;
  };
  /** Resolved sample sources and initialization behavior. */
  playback: ResolvedPlaybackConfig;
  /** Effective panel visibility and placement. */
  panels: {
    /** Score-wide controls. */
    score: {
      /** Whether the score panel is shown. */
      visible: boolean;
      /** Above or below the notation. */
      placement: TabUIScorePanelPlacement;
    };
    /** Editing controls, hidden in ViewOnly mode. */
    side: {
      /** Whether editing controls are enabled for display. */
      visible: boolean;
      /** Left or right of the notation. */
      placement: TabUISidePanelPlacement;
      /** Whether the user can collapse the panel. */
      collapsible: boolean;
      /** Initial collapse state; false when collapse is disabled. */
      initiallyCollapsed: boolean;
    };
  };
  /** Built-in theme combined with supplied overrides. */
  theme: {
    /** Resolved CSS custom-property names and values, including built-in defaults. */
    cssVars: Record<string, string>;
  };
}

const DEFAULT_LAYOUT = {
  mode: TabUILayoutMode.Wrapped,
  viewOnlyModeWidthThreshold: 500,
  unrestrictedModeWidthThreshold: 1000,
  noteTextSize: 12,
  timeSigTextSize: 48,
  tempoTextSize: 24,
  durationsHeight: 30,
  horizontalPadding: 12,
} satisfies Required<Omit<NonNullable<TabUIConfig["layout"]>, "width">>;

const DEFAULT_THEME_CSS_VARS = {
  "--tu-background-color": "#f0f0f0",
  "--tu-primary-color": "#ffffff",
  "--tu-secondary-color": "#e0e0e0",
  "--tu-border-color": "#cccccc",
  "--tu-font-color": "#333333",
  "--tu-hover-color": "#d1d1d1",
  "--tu-applied-color": "#21212114",
  "--tu-border-radius": "8px",
  "--tu-font-body": '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  "--tu-font-notation": '"Roboto", sans-serif',
  "--tu-notation-ink": "#000000",
  "--tu-notation-text": "#000000",
  "--tu-notation-note-background": "#ffffff",
  "--tu-notation-selection-stroke": "#f97316",
  "--tu-notation-selection-fill": "#ffffff80",
  "--tu-notation-selection-block-fill": "#80808080",
  "--tu-notation-cursor": "#7e22ce",
  "--tu-notation-danger": "#dc2626",
  "--tu-bend-grid": "#cccccc",
  "--tu-bend-curve": "#000000",
  "--tu-bend-handle": "#000000",
  "--tu-bend-label": "#333333",
} satisfies Record<string, string>;

const DEFAULT_SAMPLE_ROOT_NOTE = {
  noteValue: NoteValue.E,
  octave: 2,
} satisfies NoteType;

const VALID_INSTRUMENT_TONES = new Set<string>(
  Object.values(STRING_TONES).flat()
);

function isValidValue<T extends string>(
  value: unknown,
  validValues: readonly T[]
): value is T {
  return typeof value === "string" && validValues.some((v) => v === value);
}

function isValidInstrumentTone(value: string): value is InstrumentTone {
  return VALID_INSTRUMENT_TONES.has(value);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolves a layout number and rejects values outside its public contract. */
function resolveLayoutNumber(
  value: number | undefined,
  defaultValue: number,
  name: string,
  minimum: number,
  exclusiveMinimum: boolean
): number {
  const resolved = value === undefined ? defaultValue : value;
  const meetsMinimum = exclusiveMinimum
    ? resolved > minimum
    : resolved >= minimum;
  if (!Number.isFinite(resolved) || !meetsMinimum) {
    const comparison = exclusiveMinimum ? "greater than" : "non-negative";
    throw new Error(
      `TabUIEditor layout ${name} must be finite and ${comparison}`
    );
  }
  return resolved;
}

function resolvePlaybackConfig(
  config: PlaybackConfig = {}
): ResolvedPlaybackConfig {
  const resolved: ResolvedPlaybackConfig = {
    preloadAudio: config.preloadAudio ?? false,
    samples: {},
  };
  for (const [tone, sampleConfig] of Object.entries(config.samples ?? {})) {
    if (!isValidInstrumentTone(tone)) {
      throw new Error(`TabUIEditor playback sample tone is invalid: ${tone}`);
    }
    if (sampleConfig === undefined) {
      continue;
    }
    if (!isObjectRecord(sampleConfig)) {
      throw new Error(
        `TabUIEditor playback sample config must be an object for tone: ${tone}`
      );
    }
    if (typeof sampleConfig.url !== "string") {
      throw new Error(
        `TabUIEditor playback sample URL must be a string for tone: ${tone}`
      );
    }

    resolved.samples[tone] = {
      url: sampleConfig.url,
      rootFrequency: getFrequencyFromNoteType(
        sampleConfig.rootNote ?? DEFAULT_SAMPLE_ROOT_NOTE
      ),
    };
  }

  return resolved;
}

function resolveThemeCssVars(config: TabUIConfig = {}): Record<string, string> {
  return {
    ...DEFAULT_THEME_CSS_VARS,
    ...(config.theme?.ui?.colors?.background !== undefined
      ? { "--tu-background-color": config.theme.ui.colors.background }
      : {}),
    ...(config.theme?.ui?.colors?.surface !== undefined
      ? { "--tu-primary-color": config.theme.ui.colors.surface }
      : {}),
    ...(config.theme?.ui?.colors?.surfaceAlt !== undefined
      ? { "--tu-secondary-color": config.theme.ui.colors.surfaceAlt }
      : {}),
    ...(config.theme?.ui?.colors?.border !== undefined
      ? {
          "--tu-border-color": config.theme.ui.colors.border,
          "--tu-bend-grid": config.theme.ui.colors.border,
        }
      : {}),
    ...(config.theme?.ui?.colors?.text !== undefined
      ? {
          "--tu-font-color": config.theme.ui.colors.text,
          "--tu-bend-label": config.theme.ui.colors.text,
        }
      : {}),
    ...(config.theme?.ui?.colors?.hover !== undefined
      ? { "--tu-hover-color": config.theme.ui.colors.hover }
      : {}),
    ...(config.theme?.ui?.colors?.applied !== undefined
      ? { "--tu-applied-color": config.theme.ui.colors.applied }
      : {}),
    ...(config.theme?.ui?.fonts?.body !== undefined
      ? { "--tu-font-body": config.theme.ui.fonts.body }
      : {}),
    ...(config.theme?.notation?.fonts?.notation !== undefined
      ? { "--tu-font-notation": config.theme.notation.fonts.notation }
      : {}),
    ...(config.theme?.ui?.radius !== undefined
      ? { "--tu-border-radius": config.theme.ui.radius }
      : {}),
    ...(config.theme?.notation?.colors?.ink !== undefined
      ? {
          "--tu-notation-ink": config.theme.notation.colors.ink,
          "--tu-bend-curve": config.theme.notation.colors.ink,
          "--tu-bend-handle": config.theme.notation.colors.ink,
        }
      : {}),
    ...(config.theme?.notation?.colors?.text !== undefined
      ? { "--tu-notation-text": config.theme.notation.colors.text }
      : {}),
    ...(config.theme?.notation?.colors?.noteBackground !== undefined
      ? {
          "--tu-notation-note-background":
            config.theme.notation.colors.noteBackground,
        }
      : {}),
    ...(config.theme?.notation?.colors?.selectionStroke !== undefined
      ? {
          "--tu-notation-selection-stroke":
            config.theme.notation.colors.selectionStroke,
        }
      : {}),
    ...(config.theme?.notation?.colors?.selectionFill !== undefined
      ? {
          "--tu-notation-selection-fill":
            config.theme.notation.colors.selectionFill,
          "--tu-notation-selection-block-fill":
            config.theme.notation.colors.selectionFill,
        }
      : {}),
    ...(config.theme?.notation?.colors?.cursor !== undefined
      ? { "--tu-notation-cursor": config.theme.notation.colors.cursor }
      : {}),
    ...(config.theme?.notation?.colors?.danger !== undefined
      ? { "--tu-notation-danger": config.theme.notation.colors.danger }
      : {}),
  };
}

/** Removes a trailing slash while preserving an explicit root-folder override. */
export function normalizeAssetBaseUrl(baseUrl: string): string {
  if (baseUrl === "" || baseUrl === "/") {
    return baseUrl;
  }

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function resolveTabUIConfig(
  config: TabUIConfig = {}
): ResolvedTabUIConfig {
  const mode =
    config.interaction?.mode === undefined
      ? TabUIEditorMode.Edit
      : config.interaction.mode;
  if (!isValidValue(mode, Object.values(TabUIEditorMode))) {
    throw new Error("TabUIEditor interaction mode is invalid");
  }
  const assetVariant =
    config.assets?.variant === undefined ? "light" : config.assets.variant;
  if (!isValidValue(assetVariant, ["light", "dark"] as const)) {
    throw new Error("TabUIEditor asset variant is invalid");
  }
  const scorePlacement =
    config.panels?.score?.placement === undefined
      ? TabUIScorePanelPlacement.Top
      : config.panels.score.placement;
  if (!isValidValue(scorePlacement, Object.values(TabUIScorePanelPlacement))) {
    throw new Error("TabUIEditor score panel placement is invalid");
  }
  const sidePlacement =
    config.panels?.side?.placement === undefined
      ? TabUISidePanelPlacement.Left
      : config.panels.side.placement;
  if (!isValidValue(sidePlacement, Object.values(TabUISidePanelPlacement))) {
    throw new Error("TabUIEditor side panel placement is invalid");
  }
  const sideCollapsible =
    config.panels?.side?.collapsible === undefined
      ? true
      : config.panels.side.collapsible;
  const viewOnlyModeWidthThreshold = resolveLayoutNumber(
    config.layout?.viewOnlyModeWidthThreshold,
    DEFAULT_LAYOUT.viewOnlyModeWidthThreshold,
    "view-only mode width threshold",
    0,
    false
  );
  const unrestrictedModeWidthThreshold = resolveLayoutNumber(
    config.layout?.unrestrictedModeWidthThreshold,
    DEFAULT_LAYOUT.unrestrictedModeWidthThreshold,
    "unrestricted mode width threshold",
    0,
    false
  );
  if (
    !Number.isFinite(viewOnlyModeWidthThreshold) ||
    !Number.isFinite(unrestrictedModeWidthThreshold) ||
    viewOnlyModeWidthThreshold < 0 ||
    unrestrictedModeWidthThreshold <= viewOnlyModeWidthThreshold
  ) {
    throw new Error(
      "TabUIEditor layout thresholds must be finite, non-negative, and ascending"
    );
  }
  const width = config.layout?.width;
  if (
    width !== undefined &&
    (!Number.isFinite(width) || width < viewOnlyModeWidthThreshold)
  ) {
    throw new Error(
      "TabUIEditor layout width must be finite and fit the view-only threshold"
    );
  }
  const layoutMode =
    config.layout?.mode === undefined
      ? DEFAULT_LAYOUT.mode
      : config.layout.mode;
  if (!isValidValue(layoutMode, Object.values(TabUILayoutMode))) {
    throw new Error("TabUIEditor layout mode is invalid");
  }
  return {
    assets: {
      baseUrl: normalizeAssetBaseUrl(config.assets?.baseUrl?.trim() ?? ""),
      variant: assetVariant,
    },
    interaction: { mode },
    layout: {
      mode: layoutMode,
      width,
      viewOnlyModeWidthThreshold,
      unrestrictedModeWidthThreshold,
      noteTextSize: resolveLayoutNumber(
        config.layout?.noteTextSize,
        DEFAULT_LAYOUT.noteTextSize,
        "noteTextSize",
        0,
        true
      ),
      timeSigTextSize: resolveLayoutNumber(
        config.layout?.timeSigTextSize,
        DEFAULT_LAYOUT.timeSigTextSize,
        "timeSigTextSize",
        0,
        true
      ),
      tempoTextSize: resolveLayoutNumber(
        config.layout?.tempoTextSize,
        DEFAULT_LAYOUT.tempoTextSize,
        "tempoTextSize",
        0,
        true
      ),
      durationsHeight: resolveLayoutNumber(
        config.layout?.durationsHeight,
        DEFAULT_LAYOUT.durationsHeight,
        "durationsHeight",
        0,
        true
      ),
      horizontalPadding: resolveLayoutNumber(
        config.layout?.horizontalPadding,
        DEFAULT_LAYOUT.horizontalPadding,
        "horizontalPadding",
        0,
        false
      ),
    },
    playback: resolvePlaybackConfig(config.playback),
    panels: {
      score: {
        visible: config.panels?.score?.visible ?? true,
        placement: scorePlacement,
      },
      side: {
        visible:
          mode === TabUIEditorMode.Edit &&
          (config.panels?.side?.visible ?? true),
        placement: sidePlacement,
        collapsible: sideCollapsible,
        initiallyCollapsed:
          sideCollapsible && (config.panels?.side?.initiallyCollapsed ?? false),
      },
    },
    theme: {
      cssVars: resolveThemeCssVars(config),
    },
  };
}
