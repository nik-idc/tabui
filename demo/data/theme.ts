import type { TabUIConfig } from "@/config/tabui-config";

export type EditorThemeKey = "midnight" | "obsidian" | "paper" | "contrast";

export interface EditorThemeOption {
  key: EditorThemeKey;
  label: string;
  isDark: boolean;
  config: TabUIConfig;
}

const EDITOR_THEMES: EditorThemeOption[] = [
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
            body: '"Inter", sans-serif',
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
            body: '"Segoe UI", sans-serif',
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
            body: '"Merriweather", serif',
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
            body: '"Arial", sans-serif',
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
  if (
    theme === "midnight" ||
    theme === "obsidian" ||
    theme === "paper" ||
    theme === "contrast"
  ) {
    return theme;
  }

  return "obsidian";
}

export function resolveEditorTheme(searchParams: URLSearchParams): TabUIConfig {
  const themeKey = resolveEditorThemeKey(searchParams);
  const theme = EDITOR_THEMES.find((option) => option.key === themeKey);
  if (theme === undefined) {
    throw new Error(`Unknown theme key: ${themeKey}`);
  }

  return theme.config;
}
