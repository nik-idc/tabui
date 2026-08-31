import { TabUICallbacks } from "./tabui-callbacks";
import { Score } from "./notation/model";
import { NotationComponent } from "./notation/notation-component";
import { UIComponent } from "./ui";
import {
  ResolvedTabUIConfig,
  TabUIConfig,
  TabUIEditorMode,
  resolveTabUIConfig,
} from "./config/tabui-config";
import { EditorLayoutDimensions } from "./notation/controller/editor-layout-dimensions";
import { PlaybackError } from "./player";
import {
  EditorShellCallbacks,
  EditorShellComponent,
  ResponsiveInteractionMode,
} from "./ui/editor-shell";
import { TabUIEditorStateStore } from "./tabui-editor-state-store";
import {
  TabUIEditorListener,
  TabUIEditorStateSnapshot,
} from "./tabui-editor-state";
import { runCleanupSteps } from "./shared/misc/run-cleanup-steps";

export type {
  TabUIEditorError,
  TabUIEditorEvent,
  TabUIEditorListener,
  TabUIEditorStateSnapshot,
} from "./tabui-editor-state";

const DEFAULT_WIDTH_PX = 1200;

/** Internal lifecycle states for the terminal editor instance lifecycle. */
enum TabUIEditorLifecycleState {
  Uninitialized,
  Initialized,
  Disposed,
}

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

  /** Root shell presentation and host owner. */
  private _shellComponent?: EditorShellComponent;
  /** Root shell interaction owner. */
  private _shellCallbacks?: EditorShellCallbacks;

  /** Notation, controller, renderer, and player owner. */
  private _notationComponent?: NotationComponent;
  /** Non-notation control owner. */
  private _uiComponent?: UIComponent;
  /** Bound interaction owner connecting controls and notation. */
  private _callbacks?: TabUICallbacks;
  /** Whether callback binding began and therefore requires teardown. */
  private _callbacksBound = false;
  /** Responsive notation viewport observer for auto-width editors. */
  private _layoutResizeObserver?: ResizeObserver;
  /** Window resize fallback when ResizeObserver is unavailable. */
  private _windowResizeHandler?: EventListener;
  /** Pending coalesced responsive layout refresh. */
  private _layoutResizeRafId?: number;
  /** Current responsive restriction applied above the configured mode. */
  private _responsiveInteractionMode: ResponsiveInteractionMode =
    ResponsiveInteractionMode.Normal;
  /** Current terminal lifecycle state. */
  private _state: TabUIEditorLifecycleState;
  /** Stable snapshots and instance-scoped host events. */
  private readonly _stateStore = new TabUIEditorStateStore();

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

  /** Creates and renders the root shell before layout measurement. */
  private initializeShell(): void {
    this._shellComponent = new EditorShellComponent(this.rootDiv, this.config);
    this._shellComponent.render();
  }

  /** Resolves initial width from config, host measurement, or fallback. */
  private resolveLayoutWidth(): number {
    if (this.config.layout.width !== undefined) {
      return this.config.layout.width;
    }

    const measuredWidth = this._shellComponent?.measureAvailableWidth();
    return measuredWidth ?? DEFAULT_WIDTH_PX;
  }

  private resolveResponsiveInteractionMode():
    | ResponsiveInteractionMode
    | undefined {
    const viewportWidth =
      this._shellComponent?.measureResponsiveViewportWidth();
    if (viewportWidth === undefined) {
      return undefined;
    }

    const fixedWidth = this.config.layout.width;
    if (fixedWidth !== undefined) {
      return viewportWidth < fixedWidth
        ? ResponsiveInteractionMode.Blocked
        : ResponsiveInteractionMode.Normal;
    }

    return viewportWidth < this.config.layout.viewOnlyModeWidthThreshold
      ? ResponsiveInteractionMode.Blocked
      : viewportWidth < this.config.layout.unrestrictedModeWidthThreshold
        ? ResponsiveInteractionMode.ViewOnly
        : ResponsiveInteractionMode.Normal;
  }

  /** Applies the initial responsive shell state before notation is rendered. */
  private initializeResponsiveShellMode(): void {
    const mode = this.resolveResponsiveInteractionMode();
    if (mode === undefined) {
      return;
    }

    this._responsiveInteractionMode = mode;
    this._shellComponent?.setResponsiveMode(mode);
  }

  /** Creates instance dimensions from the initial host or configured width. */
  private initializeLayoutDimensions(): void {
    const width = this.resolveLayoutWidth();
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

    this._stateStore.emitPlaybackError(error);
  }

  /** Creates, renders, and binds all components owned by this editor. */
  private initializeOwnedComponents(): void {
    if (
      this._shellComponent === undefined ||
      this._layoutDimensions === undefined
    ) {
      throw new Error("TabUIEditor shell and layout are not initialized");
    }

    this._notationComponent = new NotationComponent(
      this._shellComponent.template.notationViewport,
      this.score,
      this.config,
      this._layoutDimensions,
      this.onNotationComponentError.bind(this)
    );
    this._uiComponent = new UIComponent(
      this._shellComponent.template.scorePanelHost,
      this._shellComponent.template.sidePanelHost,
      this._shellComponent.template.dialogHost,
      this._notationComponent,
      this.config
    );
    this._callbacks = new TabUICallbacks(
      this._uiComponent,
      this._notationComponent,
      this.rootDiv,
      this.emitStateChanged.bind(this)
    );

    this._uiComponent.render(this._shellComponent.sidePanelCollapsed);
    this._shellCallbacks = new EditorShellCallbacks(
      this._shellComponent,
      this._uiComponent.sideComponent,
      () => this.refreshLayout()
    );
    this._callbacksBound = true;
    this._callbacks.bind();
    this._shellCallbacks.bind();
  }

  /** Applies the responsive interaction policy using notation viewport pixels. */
  private refreshResponsiveInteractionMode(force: boolean = false): void {
    const shellComponent = this._shellComponent;
    const notationComponent = this._notationComponent;
    const uiComponent = this._uiComponent;
    if (
      shellComponent === undefined ||
      notationComponent === undefined ||
      uiComponent === undefined
    ) {
      return;
    }

    const nextMode = this.resolveResponsiveInteractionMode();
    if (nextMode === undefined) {
      return;
    }
    if (!force && nextMode === this._responsiveInteractionMode) {
      return;
    }

    this._responsiveInteractionMode = nextMode;
    const editingEnabled =
      nextMode === ResponsiveInteractionMode.Normal &&
      this.config.interaction.mode === TabUIEditorMode.Edit;
    notationComponent.setEditingEnabled(editingEnabled);
    shellComponent.setResponsiveMode(nextMode);
    if (nextMode !== ResponsiveInteractionMode.Normal) {
      uiComponent.closeOpenDialogs();
    }
    shellComponent.template.responsiveMessage.textContent =
      "This area is too small. Rotate your device, expand the window, or use a larger screen.";
    uiComponent.render(shellComponent.sidePanelCollapsed);
  }

  /** Queues one layout refresh using the latest measured viewport width. */
  private scheduleResponsiveLayoutRefresh(): void {
    if (
      this._state !== TabUIEditorLifecycleState.Initialized ||
      this._layoutResizeRafId !== undefined
    ) {
      return;
    }

    this._layoutResizeRafId = requestAnimationFrame(() => {
      this._layoutResizeRafId = undefined;
      if (this._state !== TabUIEditorLifecycleState.Initialized) {
        return;
      }

      this.refreshResponsiveInteractionMode();

      if (
        this.config.layout.width !== undefined ||
        this._responsiveInteractionMode === ResponsiveInteractionMode.Blocked
      ) {
        return;
      }

      const width = this._shellComponent?.measureAvailableWidth();
      if (width === undefined || width === this._layoutDimensions?.WIDTH) {
        return;
      }
      this.refreshLayout(width);
    });
  }

  /** Observes responsive interaction and auto-width layout changes. */
  private initializeResponsiveLayout(): void {
    if (this._shellComponent === undefined) {
      return;
    }

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() =>
        this.scheduleResponsiveLayoutRefresh()
      );
      this._layoutResizeObserver = observer;
      observer.observe(this._shellComponent.template.notationViewport);
      return;
    }

    if (typeof window !== "undefined") {
      this._windowResizeHandler = () => this.scheduleResponsiveLayoutRefresh();
      window.addEventListener("resize", this._windowResizeHandler);
    }
  }

  /** Cancels responsive work and releases browser observation. */
  private cleanupResponsiveLayout(): void {
    const rafId = this._layoutResizeRafId;
    const observer = this._layoutResizeObserver;
    const windowResizeHandler = this._windowResizeHandler;
    this._layoutResizeRafId = undefined;
    this._layoutResizeObserver = undefined;
    this._windowResizeHandler = undefined;

    runCleanupSteps(
      () => {
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
        }
      },
      () => observer?.disconnect(),
      () => {
        if (
          windowResizeHandler !== undefined &&
          typeof window !== "undefined"
        ) {
          window.removeEventListener("resize", windowResizeHandler);
        }
      }
    );
  }

  /** Cleans all resources that may have been created during initialization. */
  private cleanupOwnedResources(): void {
    runCleanupSteps(
      () => this.cleanupResponsiveLayout(),
      () => {
        if (this._callbacksBound) {
          this._callbacks?.unbind();
        }
      },
      () => this._shellCallbacks?.unbind(),
      () => this._notationComponent?.dispose(),
      () => this._shellComponent?.dispose(),
      () => {
        this._shellComponent = undefined;
        this._shellCallbacks = undefined;
        this._layoutDimensions = undefined;
        this._notationComponent = undefined;
        this._uiComponent = undefined;
        this._callbacks = undefined;
        this._callbacksBound = false;
        this._stateStore.clear();
      }
    );
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
      this.initializeShell();
      this.initializeResponsiveShellMode();
      this.initializeLayoutDimensions();
      this.initializeOwnedComponents();

      this._state = TabUIEditorLifecycleState.Initialized;
      if (
        this._notationComponent === undefined ||
        this._layoutDimensions === undefined
      ) {
        throw new Error("TabUIEditor initialized without owned components");
      }
      this._stateStore.initialize(
        this._notationComponent,
        this._layoutDimensions
      );
      this.refreshResponsiveInteractionMode(true);
      this.initializeResponsiveLayout();
    } catch (error) {
      this._state = TabUIEditorLifecycleState.Disposed;
      try {
        this.cleanupOwnedResources();
      } catch {
        // Preserve the initialization failure after best-effort rollback.
      }
      this._stateStore.clear();
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
      this._stateStore.clear();
      this._state = TabUIEditorLifecycleState.Disposed;
      return;
    }

    this._state = TabUIEditorLifecycleState.Disposed;
    try {
      this.cleanupOwnedResources();
    } finally {
      this._stateStore.clear();
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

  /** Captures and publishes a new stable state snapshot. */
  private emitStateChanged(): void {
    if (this._state !== TabUIEditorLifecycleState.Initialized) {
      return;
    }

    const notationComponent = this._notationComponent;
    const layoutDimensions = this._layoutDimensions;
    if (notationComponent === undefined || layoutDimensions === undefined) {
      throw new Error("TabUIEditor initialized without owned components");
    }
    this._stateStore.emitChange(notationComponent, layoutDimensions);
  }

  /**
   * Subscribes to this editor instance.
   * @param listener Listener receiving change and actionable error events
   * @returns Idempotent subscription disposer
   */
  public subscribe(listener: TabUIEditorListener): () => void {
    this.assertInitialized();
    return this._stateStore.subscribe(listener);
  }

  /** Best-effort restoration after a layout refresh fails partway through. */
  private restoreLayout(
    width: number,
    layoutDimensions: EditorLayoutDimensions,
    notationComponent: NotationComponent,
    callbacks: TabUICallbacks
  ): void {
    layoutDimensions.setWidth(width);
    try {
      notationComponent.refreshLayout();
      callbacks.refresh();
    } catch {
      // Preserve the original refresh failure after best-effort rollback.
    }
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

    const measuredWidth = this._shellComponent?.measureAvailableWidth();
    const nextWidth =
      width ??
      this.config.layout.width ??
      measuredWidth ??
      layoutDimensions.WIDTH;
    if (!Number.isFinite(nextWidth) || nextWidth < 0) {
      throw new Error("TabUIEditor width must be a non-negative finite number");
    }

    const previousWidth = layoutDimensions.WIDTH;
    layoutDimensions.setWidth(nextWidth);
    try {
      notationComponent.refreshLayout();
      callbacks.refresh();
    } catch (error) {
      this.restoreLayout(
        previousWidth,
        layoutDimensions,
        notationComponent,
        callbacks
      );
      throw error;
    }
  }

  /**
   * Returns the current host-observable snapshot. Its identity remains stable
   * until the next change event.
   */
  public getState(): TabUIEditorStateSnapshot {
    this.assertInitialized();
    return this._stateStore.getState();
  }

  /** Instance-scoped layout dimensions after initialization. */
  public get layoutDimensions(): EditorLayoutDimensions {
    if (this._layoutDimensions === undefined) {
      throw new Error("TabUIEditor layout is not initialized");
    }

    return this._layoutDimensions;
  }
}
