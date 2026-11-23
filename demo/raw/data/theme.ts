import type { TabUIConfig } from "@atikincode/tabui";

export type EditorThemeKey =
  | "auto"
  | "light"
  | "dark"
  | "midnight"
  | "obsidian"
  | "paper"
  | "contrast";

/** A theme with a fixed config. "auto" is not one: it picks light or dark. */
export type FixedEditorThemeKey = Exclude<EditorThemeKey, "auto">;

export interface EditorThemeOption {
  key: FixedEditorThemeKey;
  label: string;
  isDark: boolean;
  config: TabUIConfig;
}

const BASIC_FONT = '"Inter", ui-sans-serif, system-ui, sans-serif';

const EDITOR_THEMES: EditorThemeOption[] = [
  {
    key: "light",
    label: "Light",
    isDark: false,
    config: {
      assets: {
        variant: "light",
      },
      theme: {
        ui: {
          colors: {
            background: "#ffffff",
            surface: "#f6f6f7",
            surfaceAlt: "#ebebef",
            border: "#c2c2c4",
            text: "#3c3c43",
            hover: "#e2e2e3",
            applied: "#3c3c4326",
          },
          fonts: {
            default: { family: BASIC_FONT },
          },
          radius: "6px",
        },
        notation: {
          colors: {
            ink: "#3c3c43",
            text: "#1b1b1f",
            noteBackground: "#ffffff",
            selectionStroke: "#67676c",
            selectionFill: "#67676c1f",
            cursor: "#1b1b1f",
            danger: "#c62828",
          },
          fonts: {
            notation: BASIC_FONT,
          },
        },
      },
    },
  },
  {
    key: "dark",
    label: "Dark",
    isDark: true,
    config: {
      assets: {
        variant: "dark",
      },
      theme: {
        ui: {
          colors: {
            background: "#1b1b1f",
            surface: "#202127",
            surfaceAlt: "#2e2e32",
            border: "#3c3f44",
            text: "#dfdfd6",
            hover: "#32363f",
            applied: "#dfdfd626",
          },
          fonts: {
            default: { family: BASIC_FONT },
          },
          radius: "6px",
        },
        notation: {
          colors: {
            ink: "#c8c8c0",
            text: "#dfdfd6",
            noteBackground: "#1b1b1f",
            selectionStroke: "#98989f",
            selectionFill: "#98989f26",
            cursor: "#ffffff",
            danger: "#f66f81",
          },
          fonts: {
            notation: BASIC_FONT,
          },
        },
      },
    },
  },
  {
    key: "midnight",
    label: "Midnight",
    isDark: true,
    config: {
      assets: {
        variant: "dark",
      },
      theme: {
        ui: {
          colors: {
            background: "#0f172a",
            surface: "#111827",
            surfaceAlt: "#1f2937",
            border: "#334155",
            text: "#e5eefb",
            hover: "#1d4ed8",
            applied: "#2563eb55",
          },
          fonts: {
            default: { family: '"Inter", sans-serif' },
          },
          radius: "10px",
        },
        notation: {
          colors: {
            ink: "#e5eefb",
            text: "#e5eefb",
            noteBackground: "#111827",
            selectionStroke: "#f59e0b",
            selectionFill: "#f8fafc22",
            cursor: "#38bdf8",
            danger: "#f87171",
          },
          fonts: {
            notation: '"Roboto Mono", monospace',
          },
        },
      },
    },
  },
  {
    key: "obsidian",
    label: "Obsidian",
    isDark: true,
    config: {
      assets: {
        variant: "dark",
      },
      theme: {
        ui: {
          colors: {
            background: "#1a1a1a",
            surface: "#252525",
            surfaceAlt: "#333333",
            border: "#4a4a4a",
            text: "#d4d4d4",
            hover: "#6b4c00",
            applied: "#a3620044",
          },
          fonts: {
            default: { family: '"Segoe UI", sans-serif' },
          },
          radius: "8px",
        },
        notation: {
          colors: {
            ink: "#d4d4d4",
            text: "#d4d4d4",
            noteBackground: "#252525",
            selectionStroke: "#a16200",
            selectionFill: "#a3620022",
            cursor: "#d4d4d4",
            danger: "#ef4444",
          },
          fonts: {
            notation: '"Roboto Mono", monospace',
          },
        },
      },
    },
  },
  {
    key: "paper",
    label: "Paper",
    isDark: false,
    config: {
      assets: {
        variant: "light",
      },
      theme: {
        ui: {
          colors: {
            background: "#f4efe6",
            surface: "#fffdf8",
            surfaceAlt: "#ebe2d2",
            border: "#c8b79c",
            text: "#433422",
            hover: "#e2d3ba",
            applied: "#b0896855",
          },
          fonts: {
            default: { family: '"Merriweather", serif' },
          },
          radius: "6px",
        },
        notation: {
          colors: {
            ink: "#433422",
            text: "#433422",
            noteBackground: "#fffdf8",
            selectionStroke: "#9a3412",
            selectionFill: "#b0896833",
            cursor: "#7c3aed",
            danger: "#b91c1c",
          },
          fonts: {
            notation: '"Cormorant Garamond", serif',
          },
        },
      },
    },
  },
  {
    key: "contrast",
    label: "High Contrast",
    isDark: false,
    config: {
      assets: {
        variant: "light",
      },
      theme: {
        ui: {
          colors: {
            background: "#ffffff",
            surface: "#ffffff",
            surfaceAlt: "#f3f4f6",
            border: "#111111",
            text: "#111111",
            hover: "#fde047",
            applied: "#22c55e55",
          },
          fonts: {
            default: { family: '"Arial", sans-serif' },
          },
          radius: "0px",
        },
        notation: {
          colors: {
            ink: "#111111",
            text: "#111111",
            noteBackground: "#ffffff",
            selectionStroke: "#0f766e",
            selectionFill: "#14b8a633",
            cursor: "#7c3aed",
            danger: "#b91c1c",
          },
          fonts: {
            notation: '"Arial", sans-serif',
          },
        },
      },
    },
  },
];

export function getEditorThemes(): EditorThemeOption[] {
  return EDITOR_THEMES;
}

export function resolveEditorThemeKey(
  searchParams: URLSearchParams
): EditorThemeKey {
  const theme = searchParams.get("theme");
  const fixedTheme = EDITOR_THEMES.find((v) => v.key === theme);
  return fixedTheme?.key ?? "auto";
}

/** Returns the config for a theme key. "auto" uses Dark when isDark is true. */
export function getEditorThemeConfig(
  themeKey: EditorThemeKey,
  isDark = false
): TabUIConfig {
  const key = themeKey === "auto" ? (isDark ? "dark" : "light") : themeKey;
  const theme = EDITOR_THEMES.find((option) => option.key === key);
  if (theme === undefined) {
    throw new Error(`Unknown theme key: ${key}`);
  }

  return theme.config;
}

export function resolveEditorTheme(
  searchParams: URLSearchParams,
  isDark = false
): TabUIConfig {
  return getEditorThemeConfig(resolveEditorThemeKey(searchParams), isDark);
}

/** Applies the selected editor theme to demo-owned page chrome outside the editor. */
export function applyEditorThemeToPage(
  config: TabUIConfig,
  style: Pick<CSSStyleDeclaration, "setProperty"> = document.documentElement
    .style
): void {
  const colors = config.theme?.ui?.colors;
  // The page needs only its chrome colours. TabUI applies the full theme to its
  // own root through public configuration.
  const cssVars = {
    "--tu-background-color": colors?.background,
    "--tu-primary-color": colors?.surface,
    "--tu-secondary-color": colors?.surfaceAlt,
    "--tu-border-color": colors?.border,
    "--tu-font-color": colors?.text,
  };
  for (const [name, value] of Object.entries(cssVars)) {
    if (value !== undefined) {
      style.setProperty(name, value);
    }
  }
}
