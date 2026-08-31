import { BendTechniqueOptions, GuitarTechniqueType, NoteValue } from "../model";
import { SelectedMoveDirection } from "../controller";
import { NotationComponent } from "../notation-component";
import { KeyChecker } from "../../shared";
import { UIComponent } from "../../ui";
import { PlaybackState } from "../../player";

export interface EditorKeyboardCallbacks {
  copyEvent(): void;
  pasteEvent(): void;
  undoEvent(): void;
  redoEvent(): void;
  deleteSelectionEvent(): void;
  vibratoEvent(): void;
  palmMuteEvent(): void;
  bendEvent(): void;
  togglePlaybackEvent(): void;
  fretInputEvent(key: string): void;
  moveSelectionEvent(key: string): void;
  clearFretEvent(): void;
  onKeyDown(event: KeyboardEvent): void;
  bind(): void;
  unbind(): void;
}

export class EditorKeyboardDefCallbacks implements EditorKeyboardCallbacks {
  /** Editor root that most recently captured document-level keyboard ownership. */
  private static _activeRootElement?: HTMLElement;

  readonly eventsTimeEpsilon: number = 250;

  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  /** Root for this editor instance; used to ignore other editors' key events. */
  private _rootElement: HTMLElement;

  private _bound: boolean = false;
  private _prevKeyPress?: { time: number; key: string };
  private _boundOnKeyDown: (event: KeyboardEvent) => void;
  private _boundCaptureEditorFocus: () => void;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    rootElement: HTMLElement
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._rootElement = rootElement;

    this._boundOnKeyDown = this.onKeyDown.bind(this);
    this._boundCaptureEditorFocus = this.captureEditorFocus.bind(this);
  }

  private captureEditorFocus(): void {
    EditorKeyboardDefCallbacks._activeRootElement = this._rootElement;
  }

  public copyEvent(): void {
    this._notationComponent.trackController.copy();
  }

  public pasteEvent(): void {
    this._notationComponent.trackController.paste();
    this._renderFunc();
  }

  public undoEvent(): void {
    this._notationComponent.trackController.undo();
    this._renderFunc();
  }

  public redoEvent(): void {
    this._notationComponent.trackController.redo();
    this._renderFunc();
  }

  public deleteSelectionEvent(): void {
    this._notationComponent.trackController.deleteSelectedBeats();
    this._renderFunc();
  }

  private setTechnique(
    type: GuitarTechniqueType,
    bendOptions?: BendTechniqueOptions
  ): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }

    this._notationComponent.trackController.setTechnique(type, bendOptions);
    this._renderFunc();
  }

  public vibratoEvent(): void {
    this.setTechnique(GuitarTechniqueType.Vibrato);
  }

  public palmMuteEvent(): void {
    this.setTechnique(GuitarTechniqueType.PalmMute);
  }

  public bendEvent(): void {
    this._uiComponent.sideComponent.techniqueControlsComponent.showBendControls();
  }

  public togglePlaybackEvent(): void {
    if (
      this._notationComponent.trackController.playbackState !==
      PlaybackState.Idle
    ) {
      this._notationComponent.trackController.stopPlayer();
    } else {
      this._notationComponent.trackController.startPlayer();
    }

    this._renderFunc();
  }

  public fretInputEvent(key: string): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }

    let newFret = Number.parseInt(key);
    if (Number.isNaN(newFret)) {
      return;
    }

    if (this._prevKeyPress === undefined) {
      this._prevKeyPress = { time: new Date().getTime(), key: key };
      this._notationComponent.trackController.setSelectedNoteFret(newFret);
      this._renderFunc();
      return;
    }

    let now = new Date().getTime();
    let timeDiff = now - this._prevKeyPress.time;
    let combFret = Number.parseInt(this._prevKeyPress.key + key);
    newFret = timeDiff < this.eventsTimeEpsilon ? combFret : newFret;

    this._notationComponent.trackController.setSelectedNoteFret(newFret);

    this._prevKeyPress.time = now;
    this._prevKeyPress.key = key;

    this._renderFunc();
  }

  /** Moves a note cursor or exits a beat range through a horizontal edge. */
  public moveSelectionEvent(key: string): void {
    const trackController = this._notationComponent.trackController;

    switch (key) {
      case "arrowdown":
        trackController.moveSelectedNote(SelectedMoveDirection.Down);
        break;
      case "arrowup":
        trackController.moveSelectedNote(SelectedMoveDirection.Up);
        break;
      case "arrowleft":
        trackController.moveSelectedNote(SelectedMoveDirection.Left);
        break;
      case "arrowright":
        trackController.moveSelectedNote(SelectedMoveDirection.Right);
        break;
    }

    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }

  /** Extends a beat range horizontally by one beat or one bar. */
  private extendSelectionEvent(key: string, byBar: boolean): void {
    const direction =
      key === "arrowleft"
        ? SelectedMoveDirection.Left
        : key === "arrowright"
          ? SelectedMoveDirection.Right
          : undefined;
    if (direction === undefined) {
      return;
    }

    const trackController = this._notationComponent.trackController;
    const extended = byBar
      ? trackController.extendSelectionByBar(direction)
      : trackController.extendSelectionByBeat(direction);
    if (!extended) {
      return;
    }

    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }

  /** Moves the current cursor or range endpoint by one bar boundary. */
  private moveSelectionByBarEvent(key: string): void {
    const direction =
      key === "arrowleft"
        ? SelectedMoveDirection.Left
        : key === "arrowright"
          ? SelectedMoveDirection.Right
          : undefined;
    if (direction === undefined) {
      return;
    }

    const moved =
      this._notationComponent.trackController.moveSelectionByBar(direction);
    if (!moved) {
      return;
    }

    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }

  /** Cancels an active beat range and restores its anchor cursor. */
  private cancelSelectionEvent(): void {
    if (!this._notationComponent.trackController.clearSelectionRange()) {
      return;
    }

    this._renderFunc();
  }

  public clearFretEvent(): void {
    const selectionCursor =
      this._notationComponent.trackController.selectionCursor;
    if (selectionCursor === undefined) {
      return;
    }

    const note = selectionCursor.note;
    if (note === null || note.noteValue === NoteValue.None) {
      return;
    }

    this._notationComponent.trackController.setSelectedNoteFret(null);
    this._renderFunc();
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (EditorKeyboardDefCallbacks._activeRootElement !== this._rootElement) {
      return;
    }

    // Defending against input events leaking into the notation editor
    const target = event.target;
    if (typeof Element !== "undefined" && target instanceof Element) {
      const editable =
        target.matches("input, textarea, select, [contenteditable='true']") ||
        target.closest("dialog[open]") !== null;
      if (editable) {
        return;
      }
    }

    const key = event.key.toLowerCase(); // normalize
    if (key.length !== 1 && key[0] === "f") {
      return;
    }

    event.preventDefault();

    if (
      this._notationComponent.trackController.playbackState !==
      PlaybackState.Idle
    ) {
      if (event.ctrlKey && !event.shiftKey && key === "c") {
        this.copyEvent();
      } else if (key === " " && !event.ctrlKey && !event.shiftKey) {
        this.togglePlaybackEvent();
      }
      return;
    }

    if (key === "escape" && !event.ctrlKey && !event.shiftKey) {
      this.cancelSelectionEvent();
      return;
    }

    if (!this._notationComponent.trackController.editingEnabled) {
      if (event.ctrlKey && !event.shiftKey && key === "c") {
        this.copyEvent();
      } else if (key === " " && !event.ctrlKey && !event.shiftKey) {
        this.togglePlaybackEvent();
      } else if (
        event.ctrlKey &&
        !event.shiftKey &&
        (key === "arrowleft" || key === "arrowright")
      ) {
        this.moveSelectionByBarEvent(key);
      } else if (
        event.shiftKey &&
        (key === "arrowleft" || key === "arrowright")
      ) {
        this.extendSelectionEvent(key, event.ctrlKey);
      } else if (KeyChecker.isArrow(key) && !event.ctrlKey && !event.shiftKey) {
        this.moveSelectionEvent(key);
      }
      return;
    }

    if (event.ctrlKey && event.shiftKey) {
      if (key === "arrowleft" || key === "arrowright") {
        this.extendSelectionEvent(key, true);
      }
    } else if (event.ctrlKey && !event.shiftKey) {
      if (key === "arrowleft" || key === "arrowright") {
        this.moveSelectionByBarEvent(key);
      } else if (key === "c") {
        this.copyEvent();
      } else if (key === "v") {
        this.pasteEvent();
      } else if (key === "z") {
        this.undoEvent();
      } else if (key === "y") {
        this.redoEvent();
      }
    } else if (!event.ctrlKey && event.shiftKey) {
      if (key === "arrowleft" || key === "arrowright") {
        this.extendSelectionEvent(key, false);
      } else if (key === "v") {
        this.vibratoEvent();
      } else if (key === "p") {
        this.palmMuteEvent();
      } else if (key === "b") {
        this.bendEvent();
      }
    } else if (!event.ctrlKey && !event.shiftKey) {
      if (key === "delete") {
        this.deleteSelectionEvent();
      } else if (key === " ") {
        this.togglePlaybackEvent();
      } else if (KeyChecker.isNumber(key)) {
        this.fretInputEvent(key);
      } else if (KeyChecker.isArrow(key)) {
        this.moveSelectionEvent(key);
      } else if (KeyChecker.isBackspace(key)) {
        this.clearFretEvent();
      }
    }
  }

  public bind(): void {
    if (this._bound) {
      return;
    }

    this._boundOnKeyDown = this.onKeyDown.bind(this);
    document.addEventListener("keydown", this._boundOnKeyDown);
    this._rootElement.addEventListener(
      "focusin",
      this._boundCaptureEditorFocus
    );
    this._rootElement.addEventListener(
      "mousedown",
      this._boundCaptureEditorFocus
    );
    if (this._rootElement.contains?.(document.activeElement)) {
      this.captureEditorFocus();
    }
    this._bound = true;
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    document.removeEventListener("keydown", this._boundOnKeyDown);
    this._rootElement.removeEventListener(
      "focusin",
      this._boundCaptureEditorFocus
    );
    this._rootElement.removeEventListener(
      "mousedown",
      this._boundCaptureEditorFocus
    );
    if (EditorKeyboardDefCallbacks._activeRootElement === this._rootElement) {
      EditorKeyboardDefCallbacks._activeRootElement = undefined;
    }
    this._bound = false;
  }
}
