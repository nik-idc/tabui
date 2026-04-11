import { normalizeAssetBaseUrl } from "./asset-url-resolver";

export interface TabUIConfig {
  assets?: {
    baseUrl?: string;
    variant?: "light" | "dark";
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
  theme: {
    cssVars: Record<string, string>;
  };
}

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

export function resolveTabUIConfig(
  config: TabUIConfig = {}
): ResolvedTabUIConfig {
  return {
    assets: {
      baseUrl: normalizeAssetBaseUrl(config.assets?.baseUrl?.trim() ?? ""),
      variant: config.assets?.variant ?? "light",
    },
    theme: {
      cssVars: {
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
      },
    },
  };
}
