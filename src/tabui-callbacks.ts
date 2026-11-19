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
import {
  formatNotationSelection,
  NotationCursorPosition,
} from "./notation/accessibility/notation-selection-announcement";

export class TabUICallbacks {
  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;

  private _mouseCallbacks: EditorMouseCallbacks;
  private _keyboardCallbacks: EditorKeyboardCallbacks;
  private _uiCallbacks: UICallbacks;
  private _rootDiv: HTMLDivElement;
  private _onStateChanged: () => void;
  private _announce: (text: string, repeat?: boolean) => void;
  private _lastSelectionDescription?: string;
  private _suppressViewportFocusAnnouncement = false;
  private _boundOnViewportFocus: () => void;
  /** Capture listener that returns pointer-activated toolbar actions to notation. */
  private _boundOnRootClick: (event: MouseEvent) => void;
  /** Capture listener for the pitch display's wheel interaction. */
  private _boundOnRootWheel: (event: WheelEvent) => void;
  /** Pending requestAnimationFrame id for coalesced notation scroll renders. */
  private _notationRenderRafId?: number;
  /** Pending requestAnimationFrame id for coalesced selection/UI updates. */
  private _selectionRenderRafId?: number;
  private _bound = false;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    rootDiv: HTMLDivElement,
    onStateChanged: () => void = () => {},
    announce: (text: string, repeat?: boolean) => void = () => {}
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._rootDiv = rootDiv;
    this._onStateChanged = onStateChanged;
    this._announce = announce;
    this._boundOnViewportFocus = this.onViewportFocus.bind(this);
    this._boundOnRootClick = this.onRootClick.bind(this);
    this._boundOnRootWheel = this.onRootWheel.bind(this);

    this._mouseCallbacks = new EditorMouseDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      this.render.bind(this),
      (previous?: NotationCursorPosition) =>
        this.announceSelection(false, previous),
      this.focusViewport.bind(this)
    );
    this._keyboardCallbacks = new EditorKeyboardDefCallbacks(
      this._uiComponent,
      this._notationComponent,
      (type = RenderType.Full) => this.render(type),
      this._rootDiv,
      (previous) => this.announceSelection(false, previous)
    );
    this._uiCallbacks = new UICallbacks(
      this._uiComponent,
      this._notationComponent,
      () => this.render(RenderType.Full),
      () => this.render(RenderType.ActiveVoiceSelection)
    );
  }

  /** Announces changed selections or explicitly repeats optional concise output. */
  public announceSelection(
    onlyIfChanged: boolean,
    previous?: NotationCursorPosition
  ): void {
    if (this._mouseCallbacks.isSelectingBeats) {
      return;
    }

    if (onlyIfChanged && this._selectionRenderRafId !== undefined) {
      return;
    }

    const source = this._notationComponent.trackController;
    const description = formatNotationSelection(source);
    if (onlyIfChanged && description === this._lastSelectionDescription) {
      return;
    }

    this._lastSelectionDescription = description;
    if (description === undefined) {
      return;
    }

    const formatted =
      onlyIfChanged || previous === undefined
        ? description
        : formatNotationSelection(source, previous);
    if (formatted === undefined) {
      return;
    }

    this._announce(formatted, !onlyIfChanged);
  }

  /** Focuses notation without allowing the focus event to announce stale state. */
  private focusViewport(): void {
    const viewport = this._notationComponent.rootDiv;
    if (document.activeElement === viewport) return;
    this._suppressViewportFocusAnnouncement = true;
    viewport.focus({
      preventScroll: true,
      focusVisible: false,
    } as FocusOptions & {
      focusVisible: boolean;
    });
    this._suppressViewportFocusAnnouncement = false;
  }

  private onViewportFocus(): void {
    if (
      !this._suppressViewportFocusAnnouncement &&
      !this._uiComponent.dialogEnforcer.isRestoringFocus
    ) {
      this.announceSelection(false);
    }
  }

  /** Returns pointer clicks to notation unless the clicked control needs its own keys. */
  private onRootClick(event: MouseEvent): void {
    if (event.detail === 0 || this._uiComponent.dialogEnforcer.activeDialog) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || !this._rootDiv.contains(target)) {
      return;
    }
    const contentEditable = target.closest("[contenteditable]");
    if (
      target.closest("input, select, textarea, a, dialog, .tu-dialog") ||
      (contentEditable !== null &&
        contentEditable.getAttribute("contenteditable") !== "false")
    ) {
      return;
    }

    this.focusViewport();
  }

  /** Returns focus to notation before a pitch display wheel action runs. */
  private onRootWheel(event: WheelEvent): void {
    if (
      event.deltaY === 0 ||
      this._uiComponent.dialogEnforcer.activeDialog ||
      !(event.target instanceof Element) ||
      !this._rootDiv.contains(event.target) ||
      !event.target.closest("[data-tu-focus-notation-on-wheel]")
    ) {
      return;
    }

    this.focusViewport();
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
      this.announceSelection(true);
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

  public bind(): void {
    if (this._bound) {
      return;
    }

    this._bound = true;
    const activeRenderers = this._notationComponent.render();
    this._mouseCallbacks.bind(activeRenderers);
    this._lastSelectionDescription = formatNotationSelection(
      this._notationComponent.trackController
    );
    this._notationComponent.renderer.attachViewportScrollEvent(() =>
      this.render(RenderType.NotationOnly)
    );

    this._keyboardCallbacks.bind();
    this._notationComponent.rootDiv?.addEventListener(
      "focus",
      this._boundOnViewportFocus
    );
    this._rootDiv.addEventListener("click", this._boundOnRootClick, true);
    this._rootDiv.addEventListener("wheel", this._boundOnRootWheel, true);

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
    this._bound = false;
    this._keyboardCallbacks.unbind();
    this._notationComponent.rootDiv?.removeEventListener(
      "focus",
      this._boundOnViewportFocus
    );
    this._rootDiv.removeEventListener("click", this._boundOnRootClick, true);
    this._rootDiv.removeEventListener("wheel", this._boundOnRootWheel, true);
    this._uiCallbacks.unbind();
  }
}
