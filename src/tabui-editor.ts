import { TabUICallbacks } from "./tabui-callbacks";
import { Score } from "./notation/model";
import { NotationComponent } from "./notation/notation-component";
import { UIComponent } from "./ui";
import {
  ResolvedTabUIConfig,
  TabUIConfig,
  resolveTabUIConfig,
} from "./config/tabui-config";
import { EditorLayoutDimensions } from "./notation/controller/editor-layout-dimensions";

const DEFAULT_WIDTH_PX = 1200;

enum TabUIEditorState {
  Uninitialized,
  Initialized,
  Disposed,
}

export class TabUIEditor {
  readonly score: Score;
  readonly rootDiv: HTMLDivElement;
  readonly config: ResolvedTabUIConfig;
  private _layoutDimensions?: EditorLayoutDimensions;

  private _topControlsHost?: HTMLDivElement;
  private _sideControlsHost?: HTMLDivElement;
  private _notationViewport?: HTMLDivElement;

  private _notationComponent?: NotationComponent;
  private _uiComponent?: UIComponent;
  private _callbacks?: TabUICallbacks;
  private _state: TabUIEditorState;

  constructor(rootDiv: HTMLDivElement, score: Score, config: TabUIConfig = {}) {
    this.score = score;
    this.rootDiv = rootDiv;
    this.config = resolveTabUIConfig(config);
    this._state = TabUIEditorState.Uninitialized;
  }

  private applyEditorTheme(): void {
    const cssVars = Object.entries(this.config.theme.cssVars);
    for (const [cssVarName, cssVarValue] of cssVars) {
      this.rootDiv.style.setProperty(cssVarName, cssVarValue);
      document.documentElement.style.setProperty(cssVarName, cssVarValue);
    }
  }

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

  private resolveLayoutWidth(): number {
    if (this.config.layout.width !== undefined) {
      return this.config.layout.width;
    }

    const measuredWidth = this.measureAvailableWidth();
    return measuredWidth ?? DEFAULT_WIDTH_PX;
  }

  public init(): void {
    if (this._state === TabUIEditorState.Disposed) {
      throw new Error("TabUIEditor already disposed");
    }
    if (this._state === TabUIEditorState.Initialized) {
      throw new Error("TabUIEditor already initialized");
    }

    this.rootDiv.classList.add("tu-editor");
    this.applyEditorTheme();
    this.appendEditorShell();

    if (
      this._topControlsHost === undefined ||
      this._sideControlsHost === undefined ||
      this._notationViewport === undefined
    ) {
      throw new Error("TabUIEditor shell is not initialized");
    }

    const topControlsHost = this._topControlsHost;
    const sideControlsHost = this._sideControlsHost;
    const notationViewport = this._notationViewport;

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

    this._notationComponent = new NotationComponent(
      notationViewport,
      this.score,
      this.config,
      this._layoutDimensions
    );
    this._uiComponent = new UIComponent(
      topControlsHost,
      sideControlsHost,
      this._notationComponent,
      this.config
    );
    this._callbacks = new TabUICallbacks(
      this._uiComponent,
      this._notationComponent,
      this.rootDiv
    );

    this._uiComponent.render();
    this._callbacks.bind();

    this._state = TabUIEditorState.Initialized;
  }

  public dispose(): void {
    if (this._state === TabUIEditorState.Disposed) {
      return;
    }

    if (this._state === TabUIEditorState.Uninitialized) {
      this._state = TabUIEditorState.Disposed;
      return;
    }

    if (
      this._callbacks === undefined ||
      this._notationComponent === undefined
    ) {
      throw new Error("TabUIEditor initialized without owned components");
    }

    this._callbacks.unbind();
    this._notationComponent.dispose();
    this.rootDiv.replaceChildren();
    this.rootDiv.classList.remove("tu-editor");
    const cssVars = Object.keys(this.config.theme.cssVars);
    for (const cssVar of cssVars) {
      this.rootDiv.style.removeProperty(cssVar);
    }

    this._topControlsHost = undefined;
    this._sideControlsHost = undefined;
    this._notationViewport = undefined;

    this._state = TabUIEditorState.Disposed;
  }

  public get layoutDimensions(): EditorLayoutDimensions {
    if (this._layoutDimensions === undefined) {
      throw new Error("TabUIEditor layout is not initialized");
    }

    return this._layoutDimensions;
  }
}

export type { TabUIConfig };
