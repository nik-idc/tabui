import { TabUICallbacks } from "./tabui-callbacks";
import { Beat, Score, Track, VoiceNumber } from "./notation/model";
import { SelectionCursorSnapshot } from "./notation/controller/selection";
import { NotationComponent } from "./notation/notation-component";
import { UIComponent } from "./ui";
import {
  ResolvedTabUIConfig,
  TabUIConfig,
  resolveTabUIConfig,
} from "./config/tabui-config";
import { EditorLayoutDimensions } from "./notation/controller/editor-layout-dimensions";
import { PlaybackError, PlaybackErrorCode } from "./player";
import { TrackEvent } from "./shared/events";

const DEFAULT_WIDTH_PX = 1200;

/** Internal lifecycle states for the terminal editor instance lifecycle. */
enum TabUIEditorLifecycleState {
  Uninitialized,
  Initialized,
  Disposed,
}

/** Stable host-observable editor state captured at a change boundary. */
export interface TabUIEditorStateSnapshot {
  /** Track currently displayed by the notation view. */
  readonly activeTrack: Track;
  /** Score-wide playback state. */
  readonly playback: {
    /** Whether playback is active or starting. */
    readonly isPlaying: boolean;
    /** Whether playback loop mode is enabled. */
    readonly isLooped: boolean;
  };
  /** Current model-level editing selection. */
  readonly selection: {
    /** Voice currently targeted by editing operations. */
    readonly activeVoiceNumber: VoiceNumber;
    /** Selected beat range, empty when a note cursor is selected. */
    readonly beats: readonly Beat[];
    /** Current note cursor, or null when a beat range is selected. */
    readonly cursor: SelectionCursorSnapshot | null;
  };
  /** Current rendered notation dimensions in CSS pixels. */
  readonly layout: {
    /** Notation content width, excluding horizontal padding. */
    readonly width: number;
    /** Calculated height of the active track. */
    readonly height: number;
  };
}

/** Actionable asynchronous failure projected to the owning host. */
export interface TabUIEditorError {
  /** Subsystem that produced the failure. */
  readonly source: "playback";
  /** Stable machine-readable playback failure code. */
  readonly code: PlaybackErrorCode;
  /** Human-readable failure summary. */
  readonly message: string;
  /** Original thrown value for logging and diagnostics. */
  readonly cause: unknown;
}

/**
 * Public notification emitted by one editor instance.
 *
 * The payload contract remains at the editor boundary; TrackEvent provides only
 * typed delivery and does not depend on editor models or playback API types.
 */
export type TabUIEditorEvent =
  | { readonly type: "change"; readonly state: TabUIEditorStateSnapshot }
  | { readonly type: "error"; readonly error: TabUIEditorError };

/** Listener for host-observable events from one TabUIEditor instance. */
export type TabUIEditorListener = (event: TabUIEditorEvent) => void;

/** Event map adapting the public event union to TrackEvent. */
type TabUIEditorEventArgs = {
  event: TabUIEditorEvent;
};

/** Public lifecycle facade and host integration boundary for one editor. */
export class TabUIEditor {
  /** Score model owned externally and edited by this instance. */
  readonly score: Score;
  /** Host-owned root element containing editor-owned mounted contents. */
  readonly rootDiv: HTMLDivElement;
  /** Fully resolved editor configuration. */
  readonly config: ResolvedTabUIConfig;
  /** Instance-scoped geometry configuration created during initialization. */
  private _layoutDimensions?: EditorLayoutDimensions;

  /** Editor-owned host for top controls. */
  private _topControlsHost?: HTMLDivElement;
  /** Editor-owned host for side controls. */
  private _sideControlsHost?: HTMLDivElement;
  /** Editor-owned scroll viewport for notation. */
  private _notationViewport?: HTMLDivElement;

  /** Notation, controller, renderer, and player owner. */
  private _notationComponent?: NotationComponent;
  /** Non-notation control owner. */
  private _uiComponent?: UIComponent;
  /** Bound interaction owner connecting controls and notation. */
  private _callbacks?: TabUICallbacks;
  /** Whether callback binding began and therefore requires teardown. */
  private _callbacksBound = false;
  /** Current terminal lifecycle state. */
  private _state: TabUIEditorLifecycleState;
  /** Last published stable host state snapshot. */
  private _stateSnapshot?: TabUIEditorStateSnapshot;
  /** Instance-local host event dispatcher. */
  private readonly _events = new TrackEvent<TabUIEditorEventArgs>();

  /**
   * Creates an uninitialized editor for a host root and score.
   * @param rootDiv Dedicated empty host element
   * @param score Score model to edit
   * @param config Optional editor configuration
   */
  constructor(rootDiv: HTMLDivElement, score: Score, config: TabUIConfig = {}) {
    this.score = score;
    this.rootDiv = rootDiv;
    this.config = resolveTabUIConfig(config);
    this._state = TabUIEditorLifecycleState.Uninitialized;
  }

  /** Applies configured theme variables to this editor root. */
  private applyEditorTheme(): void {
    const cssVars = Object.entries(this.config.theme.cssVars);
    for (const [cssVarName, cssVarValue] of cssVars) {
      this.rootDiv.style.setProperty(cssVarName, cssVarValue);
    }
  }

  /** Measures available notation width after subtracting configured padding. */
  private measureAvailableWidth(): number | undefined {
    const notationViewport = this._notationViewport;
    if (notationViewport === undefined) {
      return undefined;
    }

    const clientWidth = notationViewport.clientWidth;
    if (clientWidth > 0) {
      return clientWidth - this.config.layout.horizontalPadding * 2;
    }

    const rectWidth = notationViewport.getBoundingClientRect?.().width ?? 0;
    return rectWidth > 0
      ? rectWidth - this.config.layout.horizontalPadding * 2
      : undefined;
  }

  /** Creates and mounts the editor-owned control and notation hosts. */
  private appendEditorShell(): void {
    const topControlsHost = document.createElement("div");
    topControlsHost.classList.add("tu-top-controls-host");
    const sideControlsHost = document.createElement("div");
    sideControlsHost.classList.add("tu-side-controls-host");
    const notationViewport = document.createElement("div");
    notationViewport.classList.add("tu-notation-viewport");

    this._topControlsHost = topControlsHost;
    this._sideControlsHost = sideControlsHost;
    this._notationViewport = notationViewport;

    this.rootDiv.appendChild(topControlsHost);
    this.rootDiv.appendChild(sideControlsHost);
    this.rootDiv.appendChild(notationViewport);
  }

  /** Resolves initial width from config, host measurement, or fallback. */
  private resolveLayoutWidth(): number {
    if (this.config.layout.width !== undefined) {
      return this.config.layout.width;
    }

    const measuredWidth = this.measureAvailableWidth();
    return measuredWidth ?? DEFAULT_WIDTH_PX;
  }

  /** Creates instance dimensions after validating the initial width. */
  private initializeLayoutDimensions(): void {
    const width = this.resolveLayoutWidth();
    if (width < this.config.layout.minWidth) {
      throw new Error(
        `TabUIEditor width must be at least ${this.config.layout.minWidth}px`
      );
    }

    this._layoutDimensions = new EditorLayoutDimensions({
      width,
      noteTextSize: this.config.layout.noteTextSize,
      timeSigTextSize: this.config.layout.timeSigTextSize,
      tempoTextSize: this.config.layout.tempoTextSize,
      durationsHeight: this.config.layout.durationsHeight,
      horizontalPadding: this.config.layout.horizontalPadding,
    });
  }

  /** Projects an internal notation/playback failure to this editor's host. */
  private onNotationComponentError(error: PlaybackError): void {
    if (this._state !== TabUIEditorLifecycleState.Initialized) {
      return;
    }

    this._events.emit("event", {
      type: "error",
      error: { source: "playback", ...error },
    });
  }

  /** Creates, renders, and binds all components owned by this editor. */
  private initializeOwnedComponents(): void {
    if (
      this._topControlsHost === undefined ||
      this._sideControlsHost === undefined ||
      this._notationViewport === undefined ||
      this._layoutDimensions === undefined
    ) {
      throw new Error("TabUIEditor shell and layout are not initialized");
    }

    this._notationComponent = new NotationComponent(
      this._notationViewport,
      this.score,
      this.config,
      this._layoutDimensions,
      this.onNotationComponentError.bind(this)
    );
    this._uiComponent = new UIComponent(
      this._topControlsHost,
      this._sideControlsHost,
      this._notationComponent,
      this.config
    );
    this._callbacks = new TabUICallbacks(
      this._uiComponent,
      this._notationComponent,
      this.rootDiv,
      this.emitStateChanged.bind(this)
    );

    this._uiComponent.render();
    this._callbacksBound = true;
    this._callbacks.bind();
  }

  /** Cleans all resources that may have been created during initialization. */
  private cleanupOwnedResources(): void {
    try {
      if (this._callbacksBound) {
        this._callbacks?.unbind();
      }
    } finally {
      try {
        this._notationComponent?.dispose();
      } finally {
        this.rootDiv.replaceChildren();
        this.rootDiv.classList.remove("tu-editor");
        const cssVars = Object.keys(this.config.theme.cssVars);
        for (const cssVar of cssVars) {
          this.rootDiv.style.removeProperty(cssVar);
        }

        this._topControlsHost = undefined;
        this._sideControlsHost = undefined;
        this._notationViewport = undefined;
        this._layoutDimensions = undefined;
        this._notationComponent = undefined;
        this._uiComponent = undefined;
        this._callbacks = undefined;
        this._callbacksBound = false;
        this._stateSnapshot = undefined;
      }
    }
  }

  /** Mounts the editor. May be called once per instance. */
  public init(): void {
    if (this._state === TabUIEditorLifecycleState.Disposed) {
      throw new Error("TabUIEditor already disposed");
    }
    if (this._state === TabUIEditorLifecycleState.Initialized) {
      throw new Error("TabUIEditor already initialized");
    }

    try {
      this.rootDiv.classList.add("tu-editor");
      this.applyEditorTheme();
      this.appendEditorShell();
      this.initializeLayoutDimensions();
      this.initializeOwnedComponents();

      this._state = TabUIEditorLifecycleState.Initialized;
      this._stateSnapshot = this.createStateSnapshot();
    } catch (error) {
      this._state = TabUIEditorLifecycleState.Disposed;
      try {
        this.cleanupOwnedResources();
      } catch {
        // Preserve the initialization failure after best-effort rollback.
      }
      this._events.clear();
      throw error;
    }
  }

  /**
   * Releases owned listeners, rendering, playback, and mounted DOM.
   * Disposal is terminal and idempotent.
   */
  public dispose(): void {
    if (this._state === TabUIEditorLifecycleState.Disposed) {
      return;
    }

    if (this._state === TabUIEditorLifecycleState.Uninitialized) {
      this._events.clear();
      this._state = TabUIEditorLifecycleState.Disposed;
      return;
    }

    this._state = TabUIEditorLifecycleState.Disposed;
    try {
      this.cleanupOwnedResources();
    } finally {
      this._events.clear();
    }
  }

  /** Throws unless the editor is initialized and active. */
  private assertInitialized(): void {
    if (this._state === TabUIEditorLifecycleState.Disposed) {
      throw new Error("TabUIEditor already disposed");
    }
    if (this._state !== TabUIEditorLifecycleState.Initialized) {
      throw new Error("TabUIEditor is not initialized");
    }
  }

  /** Captures the current host-observable state without exposing internals. */
  private createStateSnapshot(): TabUIEditorStateSnapshot {
    const notationComponent = this._notationComponent;
    const layoutDimensions = this._layoutDimensions;
    if (notationComponent === undefined || layoutDimensions === undefined) {
      throw new Error("TabUIEditor initialized without owned components");
    }

    const controller = notationComponent.trackController;
    const selectedNote = controller.selectedNote;
    const cursor =
      selectedNote === undefined
        ? null
        : {
            beat: selectedNote.beat,
            note: selectedNote.note,
            noteIndex: selectedNote.noteIndex,
          };

    return {
      activeTrack: controller.track,
      playback: {
        isPlaying: controller.isPlaying,
        isLooped: controller.isLooped,
      },
      selection: {
        activeVoiceNumber: controller.activeVoiceNumber,
        beats: [...controller.selectionBeats],
        cursor: cursor,
      },
      layout: {
        width: layoutDimensions.WIDTH,
        height: controller.windowHeight,
      },
    };
  }

  /** Captures and publishes a new stable state snapshot. */
  private emitStateChanged(): void {
    if (this._state !== TabUIEditorLifecycleState.Initialized) {
      return;
    }

    this._stateSnapshot = this.createStateSnapshot();
    this._events.emit("event", {
      type: "change",
      state: this._stateSnapshot,
    });
  }

  /**
   * Subscribes to this editor instance.
   * @param listener Listener receiving change and actionable error events
   * @returns Idempotent subscription disposer
   */
  public subscribe(listener: TabUIEditorListener): () => void {
    this.assertInitialized();
    return this._events.on("event", listener);
  }

  /**
   * Re-measures or explicitly sets width and rebuilds active-track layout.
   * @param width Optional notation content width in CSS pixels
   */
  public refreshLayout(width?: number): void {
    this.assertInitialized();
    const layoutDimensions = this._layoutDimensions;
    const notationComponent = this._notationComponent;
    const callbacks = this._callbacks;
    if (
      layoutDimensions === undefined ||
      notationComponent === undefined ||
      callbacks === undefined
    ) {
      throw new Error("TabUIEditor initialized without owned components");
    }

    const measuredWidth = this.measureAvailableWidth();
    const nextWidth =
      width ??
      this.config.layout.width ??
      measuredWidth ??
      layoutDimensions.WIDTH;
    if (
      !Number.isFinite(nextWidth) ||
      nextWidth < this.config.layout.minWidth
    ) {
      throw new Error(
        `TabUIEditor width must be at least ${this.config.layout.minWidth}px`
      );
    }

    layoutDimensions.setWidth(nextWidth);
    notationComponent.refreshLayout();
    callbacks.refresh();
  }

  /**
   * Returns the current host-observable snapshot. Its identity remains stable
   * until the next change event.
   */
  public getState(): TabUIEditorStateSnapshot {
    this.assertInitialized();
    if (this._stateSnapshot === undefined) {
      throw new Error("TabUIEditor initialized without owned components");
    }

    return this._stateSnapshot;
  }

  /** Instance-scoped layout dimensions after initialization. */
  public get layoutDimensions(): EditorLayoutDimensions {
    if (this._layoutDimensions === undefined) {
      throw new Error("TabUIEditor layout is not initialized");
    }

    return this._layoutDimensions;
  }
}
