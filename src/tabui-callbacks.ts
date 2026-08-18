import { NotationComponent } from "./notation/notation-component";
import {
  EditorKeyboardCallbacks,
  EditorKeyboardDefCallbacks,
  EditorMouseCallbacks,
  EditorMouseDefCallbacks,
  RenderType,
} from "./notation/input";
import { UIComponent } from "./ui";
import { UICallbacks } from "./ui/ui-callbacks";

export class TabUICallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;

  private _mouseCallbacks: EditorMouseCallbacks;
  private _keyboardCallbacks: EditorKeyboardCallbacks;
  private _uiCallbacks: UICallbacks;
  private _rootDiv: HTMLDivElement;
  private _onStateChanged: () => void;
  /** Pending requestAnimationFrame id for coalesced notation scroll renders. */
  private _notationRenderRafId?: number;
  /** Pending requestAnimationFrame id for coalesced selection/UI updates. */
  private _selectionRenderRafId?: number;
  private _bound = false;
  private _keyboardCaptured = false;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    rootDiv: HTMLDivElement,
    onStateChanged: () => void = () => {}
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._rootDiv = rootDiv;
    this._onStateChanged = onStateChanged;

    this._mouseCallbacks = new EditorMouseDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      this.render.bind(this)
    );
    this._keyboardCallbacks = new EditorKeyboardDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      () => this.render(RenderType.Full),
      this._rootDiv
    );
    this._uiCallbacks = new UICallbacks(
      this._uiComponent,
      this._notationComponent,
      () => this.render(RenderType.Full),
      () => this.render(RenderType.ActiveVoiceSelection),
      this.captureKeyboard.bind(this),
      this.freeKeyboard.bind(this)
    );
  }

  private renderAndBindFull(forceNotation: boolean = false): void {
    this._mouseCallbacks.unbind();
    const renderOptions = forceNotation
      ? {
          renderNotation: true,
          forceNotation: true,
          overlays: { selection: true, player: true },
        }
      : undefined;
    const activeRenderers = this._notationComponent.render(renderOptions);
    this._mouseCallbacks.bind(activeRenderers);
    this._notationComponent.renderer.attachViewportScrollEvent(() =>
      this.render(RenderType.NotationOnly)
    );

    this._uiCallbacks.unbind();
    this._uiComponent.render();
    this._uiCallbacks.bind();
  }

  private renderNotationOnly(): void {
    const activeRenderers = this._notationComponent.render({
      renderNotation: true,
      forceNotation: false,
      overlays: { selection: true, player: false },
    });
    this._mouseCallbacks.bind(activeRenderers);
    this._notationComponent.renderer.attachViewportScrollEvent(() =>
      this.render(RenderType.NotationOnly)
    );
  }

  private renderSelectionOverlayAndUI(): void {
    this._notationComponent.render({
      renderNotation: false,
      forceNotation: false,
      overlays: { selection: true, player: false },
    });

    this._uiCallbacks.unbind();
    this._uiComponent.render();
    this._uiCallbacks.bind();
  }

  private renderVisibleNoChangeAndUI(): void {
    // Active voice is controller state, not an element diff, so visible notation
    // must be refreshed even when viewport/diff state looks reusable.
    const activeRenderers = this._notationComponent.render({
      renderNotation: true,
      forceNotation: true,
      overlays: { selection: true, player: true },
    });
    this._mouseCallbacks.bind(activeRenderers);
    this._notationComponent.renderer.attachViewportScrollEvent(() =>
      this.render(RenderType.NotationOnly)
    );

    this._uiCallbacks.unbind();
    this._uiComponent.render();
    this._uiCallbacks.bind();
  }

  private cancelPendingSelectionRender(): void {
    if (this._selectionRenderRafId === undefined) {
      return;
    }

    cancelAnimationFrame(this._selectionRenderRafId);
    this._selectionRenderRafId = undefined;
  }

  private cancelPendingNotationRender(): void {
    if (this._notationRenderRafId === undefined) {
      return;
    }

    cancelAnimationFrame(this._notationRenderRafId);
    this._notationRenderRafId = undefined;
  }

  private scheduleNotationRender(): void {
    if (this._notationRenderRafId !== undefined) {
      return;
    }

    this._notationRenderRafId = requestAnimationFrame(() => {
      this._notationRenderRafId = undefined;
      this.renderNotationOnly();
    });
  }

  private scheduleSelectionRender(): void {
    if (this._selectionRenderRafId !== undefined) {
      return;
    }

    this._selectionRenderRafId = requestAnimationFrame(() => {
      this._selectionRenderRafId = undefined;
      this.renderSelectionOverlayAndUI();
    });
  }

  /**
   * Dispatches render by mode.
   * Full/NotationOnly are immediate; DragSelection is rAF-coalesced;
   * SelectionRefresh is immediate to keep selection feedback synchronous.
   */
  private render(type: RenderType): void {
    let stateChanged = true;
    switch (type) {
      case RenderType.Full:
        this.cancelPendingNotationRender();
        this.cancelPendingSelectionRender();
        this.renderAndBindFull();
        break;
      case RenderType.NotationOnly:
        this.scheduleNotationRender();
        stateChanged = false;
        break;
      case RenderType.DragSelection:
        this.scheduleSelectionRender();
        break;
      case RenderType.SelectionRefresh:
        this.cancelPendingSelectionRender();
        this.renderSelectionOverlayAndUI();
        break;
      case RenderType.ActiveVoiceSelection:
        this.cancelPendingSelectionRender();
        this.renderVisibleNoChangeAndUI();
        break;
      case RenderType.PlayerCursor:
        // Reserved for future cursor-only render path.
        stateChanged = false;
        break;
    }

    if (stateChanged) {
      this._onStateChanged();
    }
  }

  /** Forces a full refresh for explicit host-driven layout changes. */
  public refresh(): void {
    this.cancelPendingNotationRender();
    this.cancelPendingSelectionRender();
    this.renderAndBindFull(true);
    this._onStateChanged();
  }

  private captureKeyboard(): void {
    if (!this._bound || this._keyboardCaptured) {
      return;
    }

    this._keyboardCaptured = true;
    this._keyboardCallbacks.unbind();
  }

  private freeKeyboard(): void {
    if (!this._keyboardCaptured) {
      return;
    }

    this._keyboardCaptured = false;
    if (!this._bound) {
      return;
    }

    this._keyboardCallbacks.bind();
  }

  public bind(): void {
    if (this._bound) {
      return;
    }

    this._bound = true;
    const activeRenderers = this._notationComponent.render();
    this._mouseCallbacks.bind(activeRenderers);
    this._notationComponent.renderer.attachViewportScrollEvent(() =>
      this.render(RenderType.NotationOnly)
    );

    this._keyboardCallbacks.bind();

    this._uiCallbacks.bind();
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    this.cancelPendingNotationRender();
    this.cancelPendingSelectionRender();
    this._mouseCallbacks.unbind();
    this._notationComponent.renderer.detachViewportScrollEvent();
    this.freeKeyboard();
    this._bound = false;
    this._keyboardCallbacks.unbind();
    this._uiCallbacks.unbind();
  }
}
