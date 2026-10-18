import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from "@angular/core";
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

/** Angular owns the host; one fresh editor owns its contents per theme lifetime. */
@Component({
  selector: "tabui-host",
  standalone: true,
  template: '<div id="tabui-editor" #host></div>',
})
export class TabUIHost implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) score!: Score;
  @Input() variant: "light" | "dark" = "light";
  @Output() readonly ready = new EventEmitter<TabUIEditor | null>();
  @Output() readonly stateChange = new EventEmitter<TabUIEditorStateSnapshot>();
  @Output() readonly failure = new EventEmitter<string>();
  @ViewChild("host") private _host?: ElementRef<HTMLDivElement>;
  private _editor: TabUIEditor | null = null;
  private _unsubscribe?: () => void;

  ngAfterViewInit(): void {
    // Defer the initial host notification until Angular finishes its view check.
    queueMicrotask(() => {
      if (this._host) this.mount();
    });
  }

  ngOnChanges(): void {
    if (this._editor) {
      this.cleanup();
      this.mount();
    }
  }

  private mount(): void {
    if (!this._host) return;
    const editor = new TabUIEditor(this._host.nativeElement, this.score, {
      assets: { variant: this.variant },
      theme: themes[this.variant],
      interaction: { mode: TabUIEditorMode.Edit },
      layout: { mode: TabUILayoutMode.SingleLine, width: 1200 },
    });
    this._editor = editor;
    editor.init();
    this._unsubscribe = editor.subscribe((event) => {
      if (event.type === "change") this.stateChange.emit(event.state);
      else this.failure.emit(event.error.message);
    });
    this.ready.emit(editor);
  }

  private cleanup(): void {
    this._unsubscribe?.();
    this._unsubscribe = undefined;
    this._editor?.dispose();
    this._editor = null;
    this.ready.emit(null);
  }

  ngOnDestroy(): void {
    this.cleanup();
    this._host = undefined;
  }
}
