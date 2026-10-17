import { useEffect, useRef } from "react";
import {
  Score,
  TabUIEditor,
  TabUIEditorMode,
  TabUILayoutMode,
} from "@atikincode/tabui";
import type { TabUIConfig, TabUIEditorStateSnapshot } from "@atikincode/tabui";

const themes: Record<"light" | "dark", TabUIConfig["theme"]> = {
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

type TabUIProps = {
  score: Score;
  variant: "light" | "dark";
  onReady: (editor: TabUIEditor | null) => void;
  onChange: (state: TabUIEditorStateSnapshot) => void;
  onError: (message: string) => void;
};

/** React owns the host element; TabUI owns its contents for one effect lifetime. */
export function TabUI({
  score,
  variant,
  onReady,
  onChange,
  onError,
}: TabUIProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = host.current;
    if (root === null) {
      throw new Error("Missing React editor host");
    }
    // Strict Mode can run setup again after cleanup. Each setup needs a fresh instance.
    const editor = new TabUIEditor(root, score, {
      assets: { variant },
      theme: themes[variant],
      interaction: { mode: TabUIEditorMode.Edit },
      layout: { mode: TabUILayoutMode.SingleLine, width: 1200 },
    });
    editor.init();
    const unsubscribe = editor.subscribe((event) => {
      if (event.type === "change") {
        onChange(event.state);
      } else {
        onError(event.error.message);
      }
    });
    onReady(editor);
    return () => {
      unsubscribe();
      editor.dispose();
      onReady(null);
    };
  }, [score, variant, onReady, onChange, onError]);

  return <div id="tabui-editor" ref={host} />;
}
