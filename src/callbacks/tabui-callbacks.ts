import { NotationComponent } from "@/notation/notation-component";
import {
  EditorKeyboardCallbacks,
  EditorKeyboardDefCallbacks,
  EditorMouseCallbacks,
  EditorMouseDefCallbacks,
} from "./editor";
import { RenderType } from "./render-type";
import { UIComponent } from "@/ui";
import { UICallbacks } from "./ui";

export class TabUICallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;

  private _mouseCallbacks: EditorMouseCallbacks;
  private _keyboardCallbacks: EditorKeyboardCallbacks;
  private _uiCallbacks: UICallbacks;
  /** Pending requestAnimationFrame id for coalesced selection/UI updates. */
  private _selectionRenderRafId?: number;

  constructor(uiComponent: UIComponent, notationComponent: NotationComponent) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;

    this._mouseCallbacks = new EditorMouseDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      this.render.bind(this)
    );
    this._keyboardCallbacks = new EditorKeyboardDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      () => this.render(RenderType.Full)
    );
    this._uiCallbacks = new UICallbacks(
      this._uiComponent,
      this._notationComponent,
      () => this.render(RenderType.Full),
      this.captureKeyboard.bind(this),
      this.freeKeyboard.bind(this)
    );
  }

  private renderAndBindFull(): void {
    const activeRenderers = this._notationComponent.render();
    this._mouseCallbacks.bind(activeRenderers);

    this._uiCallbacks.unbind();
    this._uiComponent.render();
    this._uiCallbacks.bind();
  }

  private renderNotationOnly(): void {
    const activeRenderers = this._notationComponent.render();
    this._mouseCallbacks.bind(activeRenderers);
  }

  private renderSelectionOverlayAndUI(): void {
    this._notationComponent.renderer.renderSelectionOverlay(
      this._notationComponent.trackController
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
   * NoteSelection is immediate to keep click selection feedback synchronous.
   */
  private render(type: RenderType): void {
    switch (type) {
      case RenderType.Full:
        this.cancelPendingSelectionRender();
        this.renderAndBindFull();
        break;
      case RenderType.NotationOnly:
        this.renderNotationOnly();
        break;
      case RenderType.DragSelection:
        this.scheduleSelectionRender();
        break;
      case RenderType.NoteSelection:
        this.cancelPendingSelectionRender();
        this.renderSelectionOverlayAndUI();
        break;
      case RenderType.PlayerCursor:
        // Reserved for future cursor-only render path.
        break;
    }
  }

  private captureKeyboard(): void {
    this._keyboardCallbacks.unbind();
  }

  private freeKeyboard(): void {
    this._keyboardCallbacks.bind();
  }

  public bind(): void {
    const activeRenderers = this._notationComponent.render();
    this._mouseCallbacks.bind(activeRenderers);
    this._notationComponent.renderer.attachViewportScrollEvent(() =>
      this.render(RenderType.NotationOnly)
    );

    this._keyboardCallbacks.bind();

    this._uiCallbacks.bind();
  }

  public unbind(): void {
    this.cancelPendingSelectionRender();
    // this._mouseCallbacks.unbind();
    this._keyboardCallbacks.unbind();
    this._uiCallbacks.unbind();
  }
}
