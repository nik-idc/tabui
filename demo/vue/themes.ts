import type { TabUIConfig } from "@atikincode/tabui";

export const themes: Record<"light" | "dark", TabUIConfig["theme"]> = {
  light: {
    ui: {
      colors: {
        background: "#f1f5f9",
        surface: "#ffffff",
        surfaceAlt: "#e2e8f0",
        border: "#94a3b8",
        text: "#111827",
        hover: "#cbd5e1",
        applied: "#bae6fd",
      },
    },
    notation: {
      colors: {
        ink: "#111827",
        text: "#111827",
        noteBackground: "#ffffff",
        selectionStroke: "#2563eb",
        selectionFill: "#2563eb22",
        cursor: "#0369a1",
        danger: "#b91c1c",
      },
    },
  },
  dark: {
    ui: {
      colors: {
        background: "#0f172a",
        surface: "#111827",
        surfaceAlt: "#1f2937",
        border: "#475569",
        text: "#e5eefb",
        hover: "#334155",
        applied: "#1e40af",
      },
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
    },
  },
};
