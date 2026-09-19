import {
  BendTechniqueOptions,
  BarRepeatStatus,
  GuitarNote,
  GuitarTechniqueType,
  Note,
  NoteDuration,
  NoteValue,
  VoiceNumber,
} from "../model";
import { SelectedMoveDirection } from "../controller";
import { NotationComponent } from "../notation-component";
import { KeyChecker } from "../../shared";
import { UIComponent } from "../../ui";
import { PlaybackState } from "../../player";
import { RenderType } from "./render-type";
import {
  captureSelectionCursor,
  notationSelectionsEqual,
  NotationCursorPosition,
} from "../accessibility/notation-selection-announcement";

/**
 * Normalized event.key values (lowercase), not complete shortcuts.
 * Routing explicitly checks modifiers; duplicate values name distinct actions.
 */
export enum EditorKey {
  // Ctrl only.
  Copy = "c",
  Paste = "v",
  Undo = "z",
  Redo = "y",

  // Shift only.
  CycleVoice = "v",
  Rest = "x",
  TupletSettings = "t",
  RepeatEndSettings = "r",
  TimeSignatureSettings = "m",
  InsertBeatBefore = "a",
  InsertBarBefore = "i",
  RemoveBar = "delete",
  LetRing = "l",
  PinchHarmonic = "h",

  // No modifiers.
  TogglePlayback = " ",
  CancelSelection = "escape",
  RemoveBeat = "delete",
  DeadNote = "x",
  ClearFret = "backspace",
  ShortenDuration = "-",
  LengthenDurationAlternate = "=",
  CycleDots = ".",
  Tuplet = "t",
  Vibrato = "v",
  PalmMute = "p",
  Legato = "l",
  Slide = "s",
  BendSettings = "b",
  NaturalHarmonic = "h",
  RepeatStart = "r",
  TempoSettings = "m",
  InsertBeatAfter = "a",
  InsertBarAfter = "i",

  /** No Ctrl; accepts either Shift state for keyboard-layout differences. */
  LengthenDuration = "+",

  // No modifiers: move cursor. Horizontal arrows also accept Ctrl (by bar),
  // Shift (extend by beat), or Ctrl+Shift (extend by bar).
  MoveLeft = "arrowleft",
  MoveRight = "arrowright",
  MoveUp = "arrowup",
  MoveDown = "arrowdown",
}

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
  clearFretEvent(): boolean;
  onKeyDown(event: KeyboardEvent): void;
  bind(): void;
  unbind(): void;
}

enum StructuralAction {
  BeatAfter = "beatAfter",
  BeatBefore = "beatBefore",
  BarAfter = "barAfter",
  BarBefore = "barBefore",
  RemoveBeat = "removeBeat",
  RemoveBar = "removeBar",
}

export class EditorKeyboardDefCallbacks implements EditorKeyboardCallbacks {
  readonly eventsTimeEpsilon: number = 250;

  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: (type?: RenderType) => void;
  /** Root for this editor instance; used to ignore other editors' key events. */
  private _rootElement: HTMLElement;
  private _announce: (previous?: NotationCursorPosition) => void;

  private _bound: boolean = false;
  private _prevKeyPress?: { time: number; key: string; note: Note | null };
  private _boundOnKeyDown: (event: KeyboardEvent) => void;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: (type?: RenderType) => void,
    rootElement: HTMLElement,
    announce: (previous?: NotationCursorPosition) => void = () => {}
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._rootElement = rootElement;
    this._announce = announce;

    this._boundOnKeyDown = this.onKeyDown.bind(this);
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
    this._notationComponent.trackController.removeSelectedBeat();
    this._renderFunc();
  }

  /** Applies techniques only to eligible notes, including beat ranges. */
  private setTechnique(
    type: GuitarTechniqueType,
    bendOptions?: BendTechniqueOptions
  ): boolean {
    const controller = this._notationComponent.trackController;
    const cursor = controller.selectionCursor;
    const notes =
      cursor !== undefined
        ? cursor.note === null
          ? []
          : [cursor.note]
        : controller.selectionAsBeats.flatMap((beat) => beat.notes ?? []);
    const available = notes.some(
      (note) => note.hasTechnique(type) || note.isTechniqueApplicable(type)
    );
    if (!available) {
      return false;
    }

    this._notationComponent.trackController.setTechnique(type, bendOptions);
    this._renderFunc();
    return true;
  }

  public vibratoEvent(): void {
    this.setTechnique(GuitarTechniqueType.Vibrato);
  }

  public palmMuteEvent(): void {
    this.setTechnique(GuitarTechniqueType.PalmMute);
  }

  /** Opens bend controls only when the selected note can use them. */
  public bendEvent(): boolean {
    const note = this._notationComponent.trackController.selectionCursor?.note;
    const available =
      note != null &&
      (note.hasTechnique(GuitarTechniqueType.Bend) ||
        note.isTechniqueApplicable(GuitarTechniqueType.Bend));
    if (!available) {
      return false;
    }

    this._uiComponent.sideComponent.techniqueControlsComponent.showBendControls();
    return true;
  }

  /** Applies the next duration to the selected beats. */
  public changeDurationEvent(lengthen: boolean): void {
    const beats = this._notationComponent.trackController.selectionAsBeats;
    const reference =
      this._notationComponent.trackController.selectionEndBeat ??
      this._notationComponent.trackController.selectionCursor?.beat ??
      beats.at(-1);
    if (reference === undefined) {
      return;
    }

    const durations = [
      NoteDuration.SixtyFourth,
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
      NoteDuration.Quarter,
      NoteDuration.Half,
      NoteDuration.Whole,
    ];
    const index = durations.indexOf(reference.baseDuration);
    const nextIndex = Math.max(
      0,
      Math.min(durations.length - 1, index + (lengthen ? 1 : -1))
    );
    this._notationComponent.trackController.setDuration(durations[nextIndex]);
    this._renderFunc();
  }

  /** Cycles dots on the selected beats, using the active-end beat as reference. */
  public toggleDotsEvent(): void {
    const trackController = this._notationComponent.trackController;
    const beats = trackController.selectionAsBeats;
    const reference =
      trackController.selectionEndBeat ??
      trackController.selectionCursor?.beat ??
      beats.at(-1);
    if (reference === undefined) {
      return;
    }

    trackController.setDots((reference.dots + 1) % 3);
    this._renderFunc();
  }

  /** Cycles the keyboard-supported tuplets on the selected beats. */
  public toggleTupletEvent(): void {
    const trackController = this._notationComponent.trackController;
    const beats = trackController.selectionAsBeats;
    const reference =
      trackController.selectionEndBeat ??
      trackController.selectionCursor?.beat ??
      beats.at(-1);
    if (reference === undefined) {
      return;
    }

    const settings = reference.tupletSettings;
    const next =
      settings === null
        ? { normalCount: 2, tupletCount: 1 }
        : settings.normalCount === 2 && settings.tupletCount === 1
          ? { normalCount: 3, tupletCount: 2 }
          : null;
    if (next === null) {
      // Custom tuplets and triplets both return to no tuplet.
      trackController.setSelectedBeatsTuplet(1, 1);
    } else {
      trackController.setSelectedBeatsTuplet(
        next.normalCount,
        next.tupletCount
      );
    }
    this._renderFunc();
  }

  /** Selects the next active voice, wrapping after voice four. */
  public nextVoiceEvent(): void {
    const voice = this._notationComponent.trackController.activeVoiceNumber;
    this._notationComponent.trackController.setActiveVoiceNumber(
      ((voice % 4) + 1) as VoiceNumber
    );
    this._renderFunc(RenderType.ActiveVoiceSelection);
  }

  /** Shows the existing tuplet, repeat, tempo, or time-signature dialog. */
  public showKeyboardDialogEvent(
    dialog: "tuplet" | "repeat" | "tempo" | "timeSignature"
  ): void {
    const side = this._uiComponent.sideComponent;
    if (dialog === "tuplet") {
      side.noteControlsComponent.showTupletControls();
    } else if (dialog === "repeat") {
      side.measureControlsComponent.showRepeatCountControls();
    } else if (dialog === "tempo") {
      side.measureControlsComponent.showTempoControls();
    } else {
      side.measureControlsComponent.showTimeSigControls();
    }
  }

  /** Sets or toggles a note technique from a keyboard shortcut. */
  public techniqueEvent(type: GuitarTechniqueType): boolean {
    return this.setTechnique(type);
  }

  /** Inserts or removes a beat or bar through the mouse controller operations. */
  private structuralEvent(action: StructuralAction): void {
    const controller = this._notationComponent.trackController;
    switch (action) {
      case StructuralAction.BeatAfter:
        controller.insertBeatAfterSelected();
        break;
      case StructuralAction.BeatBefore:
        controller.insertBeatBeforeSelected();
        break;
      case StructuralAction.BarAfter:
        controller.insertBarAfterSelected();
        break;
      case StructuralAction.BarBefore:
        controller.insertBarBeforeSelected();
        break;
      case StructuralAction.RemoveBeat:
        controller.removeSelectedBeat();
        break;
      case StructuralAction.RemoveBar:
        controller.removeSelectedBar();
        break;
    }
    this._renderFunc();
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

  /** Combines rapid digits only when they target the same note. */
  public fretInputEvent(key: string): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }

    let newFret = Number.parseInt(key);
    if (Number.isNaN(newFret)) {
      return;
    }

    const controller = this._notationComponent.trackController;
    const note = controller.selectionCursor?.note;
    const now = new Date().getTime();
    const previous = this._prevKeyPress;
    if (note != null && previous?.note === note) {
      const timeDiff = now - previous.time;
      if (timeDiff < this.eventsTimeEpsilon) {
        newFret = Number.parseInt(previous.key + key);
      }
    }

    controller.setSelectedNoteFret(newFret);
    this._prevKeyPress = {
      time: now,
      key,
      note: controller.selectionCursor?.note ?? null,
    };

    this._renderFunc();
  }

  /** Moves a note cursor or exits a beat range through a horizontal edge. */
  public moveSelectionEvent(key: string): void {
    const trackController = this._notationComponent.trackController;
    const previous = captureSelectionCursor(trackController.selectionCursor);

    switch (key) {
      case EditorKey.MoveDown:
        trackController.moveSelectedNote(SelectedMoveDirection.Down);
        break;
      case EditorKey.MoveUp:
        trackController.moveSelectedNote(SelectedMoveDirection.Up);
        break;
      case EditorKey.MoveLeft:
        trackController.moveSelectedNote(SelectedMoveDirection.Left);
        break;
      case EditorKey.MoveRight:
        trackController.moveSelectedNote(SelectedMoveDirection.Right);
        break;
    }

    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
    const current = captureSelectionCursor(trackController.selectionCursor);
    if (!notationSelectionsEqual(previous, current) && current !== undefined) {
      this._announce(previous);
    }
  }

  /** Extends a beat range horizontally by one beat or one bar. */
  private extendSelectionEvent(key: string, byBar: boolean): void {
    const direction =
      key === EditorKey.MoveLeft
        ? SelectedMoveDirection.Left
        : key === EditorKey.MoveRight
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
  private moveSelectionByBarEvent(key: string): boolean {
    const direction =
      key === EditorKey.MoveLeft
        ? SelectedMoveDirection.Left
        : key === EditorKey.MoveRight
          ? SelectedMoveDirection.Right
          : undefined;
    if (direction === undefined) {
      return false;
    }

    const moved =
      this._notationComponent.trackController.moveSelectionByBar(direction);
    if (!moved) {
      return false;
    }

    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
    return true;
  }

  /** Cancels an active beat range and restores its anchor cursor. */
  private cancelSelectionEvent(): boolean {
    if (!this._notationComponent.trackController.clearSelectionRange()) {
      return false;
    }

    this._renderFunc();
    return true;
  }

  /** Clears a populated note and reports whether the action was accepted. */
  public clearFretEvent(): boolean {
    const selectionCursor =
      this._notationComponent.trackController.selectionCursor;
    if (selectionCursor === undefined) {
      return false;
    }

    const note = selectionCursor.note;
    if (note === null || note.noteValue === NoteValue.None) {
      return false;
    }

    this._notationComponent.trackController.setSelectedNoteFret(null);
    this._renderFunc();
    return true;
  }

  /** Routes shared actions before editing; true means consume the key. */
  private dispatchShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    const { ctrlKey, shiftKey } = event;
    const controller = this._notationComponent.trackController;

    if (ctrlKey && !shiftKey && key === EditorKey.Copy) {
      this.copyEvent();
      return true;
    }
    if (key === EditorKey.TogglePlayback && !ctrlKey && !shiftKey) {
      this.togglePlaybackEvent();
      return true;
    }
    if (controller.playbackState !== PlaybackState.Idle) {
      return false;
    }

    if (key === EditorKey.CancelSelection && !ctrlKey && !shiftKey) {
      return this.cancelSelectionEvent();
    }

    if (KeyChecker.isArrow(key)) {
      const horizontal =
        key === EditorKey.MoveLeft || key === EditorKey.MoveRight;

      if (horizontal && shiftKey) {
        this.extendSelectionEvent(key, ctrlKey);
        return true;
      }
      if (horizontal && ctrlKey) {
        return this.moveSelectionByBarEvent(key);
      }
      if (!ctrlKey && !shiftKey) {
        this.moveSelectionEvent(key);
        return true;
      }
      return false;
    }

    return controller.editingEnabled && this.dispatchEditingShortcut(event);
  }

  /** Dispatches supported shortcuts only while this notation has focus. */
  public onKeyDown(event: KeyboardEvent): void {
    if (!this.isKeyboardEventEligible(event)) {
      return;
    }

    if (this.dispatchShortcut(event)) {
      event.preventDefault();
    }
  }

  /** Checks focus ownership and excludes browser and control input. */
  private isKeyboardEventEligible(event: KeyboardEvent): boolean {
    const activeElement =
      typeof document === "undefined" ? null : document.activeElement;
    const notationFocused =
      activeElement !== null &&
      activeElement === this._notationComponent.rootDiv &&
      this._rootElement.contains(activeElement);
    if (!notationFocused) {
      return false;
    }

    // Defending against control events leaking into the notation editor
    const target = event.target;
    if (typeof Element !== "undefined" && target instanceof Element) {
      const interactive =
        target.matches(
          "button, input, textarea, select, a, [contenteditable='true']"
        ) || target.closest("dialog[open], .tu-dialog[open]") !== null;
      if (interactive) {
        return false;
      }
    }

    if (
      event.defaultPrevented ||
      event.altKey ||
      event.metaKey ||
      event.isComposing ||
      event.keyCode === 229 // Fallback for legacy browsers
    ) {
      return false;
    }

    const key = event.key.toLowerCase(); // normalize
    return key !== "tab" && !(key.length !== 1 && key[0] === "f");
  }

  /** Dispatches editing bindings only when their selection is available. */
  private dispatchEditingShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    const { ctrlKey, shiftKey } = event;
    const controller = this._notationComponent.trackController;
    if (!ctrlKey) {
      const barActions: readonly string[] = [
        EditorKey.RepeatStart,
        EditorKey.RepeatEndSettings,
        EditorKey.TempoSettings,
        EditorKey.TimeSignatureSettings,
      ];
      if (barActions.includes(key) && !controller.selectionCursor) {
        return false;
      }

      const fretAction =
        (key === EditorKey.DeadNote && !shiftKey) ||
        KeyChecker.isNumber(key) ||
        key === EditorKey.ClearFret;
      if (fretAction && controller.selectionCursor === undefined) {
        return false;
      }
    }

    const lengthen =
      key === EditorKey.LengthenDuration ||
      (key === EditorKey.LengthenDurationAlternate && !shiftKey);
    if (!ctrlKey && lengthen) {
      this.changeDurationEvent(true);
    } else if (ctrlKey && shiftKey) {
      return false;
    } else if (ctrlKey) {
      if (key === EditorKey.Paste) {
        this.pasteEvent();
      } else if (key === EditorKey.Undo) {
        this.undoEvent();
      } else if (key === EditorKey.Redo) {
        this.redoEvent();
      } else {
        return false;
      }
    } else if (shiftKey) {
      if (key === EditorKey.CycleVoice) {
        this.nextVoiceEvent();
      } else if (key === EditorKey.Rest) {
        controller.setSelectedBeatRest();
        this._renderFunc();
      } else if (key === EditorKey.TupletSettings) {
        this.showKeyboardDialogEvent("tuplet");
      } else if (key === EditorKey.RepeatEndSettings) {
        this.showKeyboardDialogEvent("repeat");
      } else if (key === EditorKey.TimeSignatureSettings) {
        this.showKeyboardDialogEvent("timeSignature");
      } else if (key === EditorKey.InsertBeatBefore) {
        this.structuralEvent(StructuralAction.BeatBefore);
      } else if (key === EditorKey.InsertBarBefore) {
        this.structuralEvent(StructuralAction.BarBefore);
      } else if (key === EditorKey.RemoveBar) {
        this.structuralEvent(StructuralAction.RemoveBar);
      } else if (key === EditorKey.LetRing) {
        return this.techniqueEvent(GuitarTechniqueType.LetRing);
      } else if (key === EditorKey.PinchHarmonic) {
        return this.techniqueEvent(GuitarTechniqueType.PinchHarmonic);
      } else {
        return false;
      }
    } else {
      if (key === EditorKey.RemoveBeat) {
        this.deleteSelectionEvent();
      } else if (key === EditorKey.DeadNote) {
        if (!(controller.selectionCursor?.note instanceof GuitarNote)) {
          return false;
        }
        controller.setSelectedNoteFret(-1);
        this._renderFunc();
      } else if (KeyChecker.isNumber(key)) {
        this.fretInputEvent(key);
      } else if (key === EditorKey.ClearFret) {
        return this.clearFretEvent();
      } else if (key === EditorKey.ShortenDuration) {
        this.changeDurationEvent(false);
      } else if (key === EditorKey.CycleDots) {
        this.toggleDotsEvent();
      } else if (key === EditorKey.Tuplet) {
        this.toggleTupletEvent();
      } else if (key === EditorKey.Vibrato) {
        return this.techniqueEvent(GuitarTechniqueType.Vibrato);
      } else if (key === EditorKey.PalmMute) {
        return this.techniqueEvent(GuitarTechniqueType.PalmMute);
      } else if (key === EditorKey.Legato) {
        return this.techniqueEvent(GuitarTechniqueType.Legato);
      } else if (key === EditorKey.Slide) {
        return this.techniqueEvent(GuitarTechniqueType.Slide);
      } else if (key === EditorKey.BendSettings) {
        return this.bendEvent();
      } else if (key === EditorKey.NaturalHarmonic) {
        return this.techniqueEvent(GuitarTechniqueType.NaturalHarmonic);
      } else if (key === EditorKey.RepeatStart) {
        controller.setSelectedBarRepeatStatus({
          status: BarRepeatStatus.Start,
          enabled: !controller.selectionCursor?.bar.masterBar.isRepeatStart,
        });
        this._renderFunc();
      } else if (key === EditorKey.TempoSettings) {
        this.showKeyboardDialogEvent("tempo");
      } else if (key === EditorKey.InsertBeatAfter) {
        this.structuralEvent(StructuralAction.BeatAfter);
      } else if (key === EditorKey.InsertBarAfter) {
        this.structuralEvent(StructuralAction.BarAfter);
      } else {
        return false;
      }
    }
    return true;
  }

  public bind(): void {
    if (this._bound) {
      return;
    }

    this._boundOnKeyDown = this.onKeyDown.bind(this);
    document.addEventListener("keydown", this._boundOnKeyDown);
    this._bound = true;
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    document.removeEventListener("keydown", this._boundOnKeyDown);
    this._bound = false;
  }
}
