import { normalizeAssetBaseUrl } from "./asset-url-resolver";
import {
  InstrumentTone,
  NoteType,
  NoteValue,
  getFrequencyFromNoteType,
} from "../notation/model";

export interface PlaybackSampleConfig {
  url: string;
  /**
   * Pitch recorded in the sample file.
   * This is sample-dependent metadata: a C3 sample should use C3, an E2 sample
   * should use E2, etc. TabUI resolves this to frequency internally so playback
   * can transpose the recording to other notes with playbackRate.
   */
  rootNote?: NoteType;
}

export type PlaybackSampleConfigs = Partial<
  Record<InstrumentTone, PlaybackSampleConfig>
>;

export interface PlaybackConfig {
  /** Loads configured score samples during editor initialization. */
  preloadAudio?: boolean;
  /** Sample configuration keyed by instrument tone. */
  samples?: PlaybackSampleConfigs;
}

export interface ResolvedPlaybackSampleConfig {
  url: string;
  /** Frequency of the pitch recorded in the sample file. */
  rootFrequency: number;
}

export type ResolvedPlaybackSampleConfigs = Partial<
  Record<InstrumentTone, ResolvedPlaybackSampleConfig>
>;

export interface ResolvedPlaybackConfig {
  preloadAudio: boolean;
  samples: ResolvedPlaybackSampleConfigs;
}

export enum TabUIEditorMode {
  Edit = "edit",
  ViewOnly = "view-only",
}

/** Controls whether score bars wrap to the available notation width. */
export enum TabUILayoutMode {
  Wrapped = "wrapped",
  SingleLine = "single-line",
}

export enum TabUIScorePanelPlacement {
  Top = "top",
  Bottom = "bottom",
}

export enum TabUISidePanelPlacement {
  Left = "left",
  Right = "right",
}

export interface TabUIConfig {
  assets?: {
    baseUrl?: string;
    variant?: "light" | "dark";
  };
  interaction?: {
    mode?: TabUIEditorMode;
  };
  layout?: {
    mode?: TabUILayoutMode;
    width?: number;
    viewOnlyModeWidthThreshold?: number;
    unrestrictedModeWidthThreshold?: number;
    noteTextSize?: number;
    timeSigTextSize?: number;
    tempoTextSize?: number;
    durationsHeight?: number;
    horizontalPadding?: number;
  };
  playback?: PlaybackConfig;
  panels?: {
    score?: {
      visible?: boolean;
      placement?: TabUIScorePanelPlacement;
    };
    side?: {
      visible?: boolean;
      placement?: TabUISidePanelPlacement;
      collapsible?: boolean;
      initiallyCollapsed?: boolean;
    };
  };
  theme?: {
    ui?: {
      colors?: {
        background?: string;
        surface?: string;
        surfaceAlt?: string;
        border?: string;
        text?: string;
        hover?: string;
        applied?: string;
      };
      fonts?: {
        body?: string;
      };
      radius?: string;
    };
    notation?: {
      colors?: {
        ink?: string;
        text?: string;
        noteBackground?: string;
        selectionStroke?: string;
        selectionFill?: string;
        cursor?: string;
        danger?: string;
      };
      fonts?: {
        notation?: string;
      };
    };
  };
}

export interface ResolvedTabUIConfig {
  assets: {
    baseUrl: string;
    variant: "light" | "dark";
  };
  interaction: {
    mode: TabUIEditorMode;
  };
  layout: {
    mode: TabUILayoutMode;
    width?: number;
    viewOnlyModeWidthThreshold: number;
    unrestrictedModeWidthThreshold: number;
    noteTextSize: number;
    timeSigTextSize: number;
    tempoTextSize: number;
    durationsHeight: number;
    horizontalPadding: number;
  };
  playback: ResolvedPlaybackConfig;
  panels: {
    score: {
      visible: boolean;
      placement: TabUIScorePanelPlacement;
    };
    side: {
      visible: boolean;
      placement: TabUISidePanelPlacement;
      collapsible: boolean;
      initiallyCollapsed: boolean;
    };
  };
  theme: {
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

function resolvePlaybackConfig(
  config: PlaybackConfig = {}
): ResolvedPlaybackConfig {
  const resolved: ResolvedPlaybackConfig = {
    preloadAudio: config.preloadAudio ?? false,
    samples: {},
  };
  for (const [tone, sampleConfig] of Object.entries(config.samples ?? {})) {
    if (sampleConfig === undefined) {
      continue;
    }

    resolved.samples[tone as InstrumentTone] = {
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

export function resolveTabUIConfig(
  config: TabUIConfig = {}
): ResolvedTabUIConfig {
  const mode = config.interaction?.mode ?? TabUIEditorMode.Edit;
  const sideCollapsible = config.panels?.side?.collapsible ?? true;
  const viewOnlyModeWidthThreshold =
    config.layout?.viewOnlyModeWidthThreshold ??
    DEFAULT_LAYOUT.viewOnlyModeWidthThreshold;
  const unrestrictedModeWidthThreshold =
    config.layout?.unrestrictedModeWidthThreshold ??
    DEFAULT_LAYOUT.unrestrictedModeWidthThreshold;
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
  const layoutMode = config.layout?.mode ?? DEFAULT_LAYOUT.mode;
  if (
    layoutMode !== TabUILayoutMode.Wrapped &&
    layoutMode !== TabUILayoutMode.SingleLine
  ) {
    throw new Error("TabUIEditor layout mode is invalid");
  }
  return {
    assets: {
      baseUrl: normalizeAssetBaseUrl(config.assets?.baseUrl?.trim() ?? ""),
      variant: config.assets?.variant ?? "light",
    },
    interaction: { mode },
    layout: {
      mode: layoutMode,
      width,
      viewOnlyModeWidthThreshold,
      unrestrictedModeWidthThreshold,
      noteTextSize: config.layout?.noteTextSize ?? DEFAULT_LAYOUT.noteTextSize,
      timeSigTextSize:
        config.layout?.timeSigTextSize ?? DEFAULT_LAYOUT.timeSigTextSize,
      tempoTextSize:
        config.layout?.tempoTextSize ?? DEFAULT_LAYOUT.tempoTextSize,
      durationsHeight:
        config.layout?.durationsHeight ?? DEFAULT_LAYOUT.durationsHeight,
      horizontalPadding:
        config.layout?.horizontalPadding ?? DEFAULT_LAYOUT.horizontalPadding,
    },
    playback: resolvePlaybackConfig(config.playback),
    panels: {
      score: {
        visible: config.panels?.score?.visible ?? true,
        placement:
          config.panels?.score?.placement ?? TabUIScorePanelPlacement.Top,
      },
      side: {
        visible:
          mode === TabUIEditorMode.Edit &&
          (config.panels?.side?.visible ?? true),
        placement:
          config.panels?.side?.placement ?? TabUISidePanelPlacement.Left,
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
