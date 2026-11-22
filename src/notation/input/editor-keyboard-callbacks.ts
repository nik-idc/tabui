import {
  AccentType,
  BarRepeatStatus,
  BeatGuitarTechniqueType,
  DynamicDirection,
  GuitarNote,
  GuitarTechniqueType,
  Note,
  NoteDuration,
  NoteValue,
  StrokeDirection,
  TUPLET_PRESETS,
  tupletSettingsEqual,
  VoiceNumber,
} from "../model";
import type { SetTechniqueOptions } from "../model/editor/set-technique-options";
import { SelectedMoveDirection } from "../controller";
import { NotationComponent } from "../notation-component";
import {
  KeyChecker,
  readClipboardText,
  writeClipboardText,
} from "../../shared";
import { UIComponent } from "../../ui";
import { PlaybackState } from "../../player";
import { RenderType } from "./render-type";
import {
  captureSelectionCursor,
  formatSelectionRecap,
  notationSelectionsEqual,
  NotationCursorPosition,
} from "../accessibility/notation-selection-announcement";

/**
 * Normalized event.key values (lowercase), not complete shortcuts.
 * Routing explicitly checks modifiers; duplicate values name distinct actions.
 */
/* eslint-disable @typescript-eslint/no-duplicate-enum-values -- Actions share keys; modifiers distinguish shortcuts. */
export enum EditorKey {
  // Ctrl or Command for Select All and Undo; clipboard uses native events.
  // Redo also accepts Ctrl/Command+Shift+Z; Y stays Ctrl-only.
  SelectAll = "a",
  Copy = "c",
  Cut = "x",
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
  TieToEarliest = "j",
  StrokeSettings = "d",
  HeavyAccent = "c",

  // Alt (Option on macOS) only. Matched on event.code, because Option changes
  // event.key on macOS.
  AddStaffBelow = "KeyN",
  RemoveStaff = "Delete",

  // Ctrl with Up or Down, also on macOS, like bar navigation. Alt+Up and
  // Alt+Down move focus between editor sections instead.
  StaffUp = "ArrowUp",
  StaffDown = "ArrowDown",

  // No modifiers; also during playback. Matched on event.code, so the same
  // physical keys work on layouts where [ and ] need AltGr.
  PlaybackPitchDown = "BracketLeft",
  PlaybackPitchUp = "BracketRight",

  // Space or Shift+Space.
  TogglePlayback = " ",

  // No modifiers.
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
  Tie = "j",
  Slide = "s",
  BendSettings = "b",
  NaturalHarmonic = "h",
  DownStroke = "d",
  UpStroke = "u",
  Tap = "k",
  Accent = "c",
  RepeatStart = "r",
  TempoSettings = "m",
  InsertBeatAfter = "a",
  InsertBarAfter = "i",
  // Also during playback.
  Loop = "o",
  Metronome = "n",
  WhereAmI = "w",

  // Ctrl only.
  FirstBar = "home",
  LastBar = "end",

  /** No Ctrl; accepts either Shift state for keyboard-layout differences. */
  LengthenDuration = "+",
  /** One dynamic level louder ("greater"). No Ctrl; either Shift state. */
  LouderDynamic = ">",
  /** One dynamic level softer ("less"). No Ctrl; either Shift state. */
  SofterDynamic = "<",

  // No modifiers: move cursor. Horizontal arrows also accept Ctrl (by bar),
  // Shift (extend by beat), or Ctrl+Shift (extend by bar). Vertical arrows
  // with Shift raise or lower the pitch.
  MoveLeft = "arrowleft",
  MoveRight = "arrowright",
  MoveUp = "arrowup",
  MoveDown = "arrowdown",
}

/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

export interface EditorKeyboardCallbacks {
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
  /** Set when any clipboard event fires; see `fallBackIfNoClipboardEvent`. */
  private _clipboardEventFired: boolean = false;
  private _prevKeyPress?: { time: number; key: string; note: Note | null };
  private _boundOnKeyDown: (event: KeyboardEvent) => void;
  /** Stable document copy listener owned by this editor instance. */
  private _boundOnCopy: (event: ClipboardEvent) => void;
  /** Stable document cut listener owned by this editor instance. */
  private _boundOnCut: (event: ClipboardEvent) => void;
  /** Stable document paste listener owned by this editor instance. */
  private _boundOnPaste: (event: ClipboardEvent) => void;

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
    this._boundOnCopy = this.onCopy.bind(this);
    this._boundOnCut = this.onCut.bind(this);
    this._boundOnPaste = this.onPaste.bind(this);
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

  /** Applies techniques to eligible selections using the requested Tie search mode. */
  private setTechnique(
    type: GuitarTechniqueType,
    options: SetTechniqueOptions = {}
  ): boolean {
    const controller = this._notationComponent.trackController;
    if (!controller.canSetTechnique(type, options)) {
      return false;
    }

    controller.setTechnique(type, options);
    this._renderFunc();
    return true;
  }

  public vibratoEvent(): void {
    this.setTechnique(GuitarTechniqueType.Vibrato);
  }

  public palmMuteEvent(): void {
    this.techniqueEvent(GuitarTechniqueType.PalmMute);
  }

  /** Opens bend controls only when the selected note can use them. */
  public bendEvent(): boolean {
    const controller = this._notationComponent.trackController;
    if (!controller.canSetTechnique(GuitarTechniqueType.Bend)) {
      return false;
    }

    this._uiComponent.sideComponent.techniqueControlsComponent.showBendControls();
    return true;
  }

  /** Toggles an accent of one kind when the target notes can take one. */
  public accentEvent(kind: AccentType): boolean {
    const controller = this._notationComponent.trackController;
    if (!controller.canSetTechnique(GuitarTechniqueType.Accent)) {
      return false;
    }

    controller.toggleAccent(kind);
    this._renderFunc();
    return true;
  }

  /** Toggles a stroke in one direction when the target beats can take one. */
  public strokeEvent(direction: StrokeDirection): boolean {
    const controller = this._notationComponent.trackController;
    if (!controller.canSetBeatTechnique(BeatGuitarTechniqueType.Stroke)) {
      return false;
    }

    controller.toggleStroke(direction);
    this._renderFunc();
    return true;
  }

  /** Opens stroke settings when the target beats can take a stroke. */
  public strokeSettingsEvent(): boolean {
    const controller = this._notationComponent.trackController;
    if (!controller.canSetBeatTechnique(BeatGuitarTechniqueType.Stroke)) {
      return false;
    }

    this._uiComponent.sideComponent.techniqueControlsComponent.showStrokeControls();
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

  /**
   * Shifts each selected beat's own dynamic one level, stopping at ppp and fff,
   * then speaks the active beat's dynamic.
   * @returns False when there is no selected beat, so the key is not used.
   */
  public shiftDynamicEvent(direction: DynamicDirection): boolean {
    const controller = this._notationComponent.trackController;
    if (controller.selectionAsBeats.length === 0) {
      return false;
    }

    controller.shiftSelectedDynamics(direction);
    this._renderFunc();
    // At ppp or fff nothing changes; speaking the level still confirms the key.
    this._uiComponent.sideComponent.noteControlsComponent.announceDynamic();
    return true;
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
    const { duplet, triplet } = TUPLET_PRESETS;
    const next =
      settings === null
        ? duplet
        : tupletSettingsEqual(settings, duplet)
          ? triplet
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

  /** Applies a technique; Tie can optionally search for its earliest source. */
  public techniqueEvent(
    type: GuitarTechniqueType,
    options: SetTechniqueOptions = {}
  ): boolean {
    return this.setTechnique(type, options);
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

  /** Moves the cursor to the first or last bar, like the toolbar buttons. */
  private jumpToBarEvent(first: boolean): void {
    const controller = this._notationComponent.trackController;
    if (first) {
      controller.selectFirstBar();
    } else {
      controller.selectLastBar();
    }
    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }

  /** Raises or lowers the selected notes by one semitone. */
  private shiftPitchEvent(semitones: number): boolean {
    const controller = this._notationComponent.trackController;
    if (!controller.canShiftSelectedPitch(semitones)) {
      return false;
    }
    controller.shiftSelectedPitch(semitones);
    this._renderFunc();
    return true;
  }

  /**
   * Handles loop, metronome, and playback pitch. Like their toolbar buttons,
   * they also work during playback and in view-only mode.
   */
  private dispatchTransportShortcut(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return false;
    }
    const controller = this._notationComponent.trackController;
    const key = event.key.toLowerCase();
    if (key === EditorKey.WhereAmI) {
      // Changes nothing, so it also works in view-only mode.
      const recap = formatSelectionRecap(controller);
      if (recap === undefined) {
        return false;
      }
      this._uiComponent.announce(recap, true);
      return true;
    }
    let message: string;
    if (key === EditorKey.Loop) {
      controller.toggleLoop();
      message = `Loop ${controller.isLooped ? "on" : "off"}`;
    } else if (key === EditorKey.Metronome) {
      controller.setMetronomeEnabled(!controller.metronomeEnabled);
      message = `Metronome ${controller.metronomeEnabled ? "on" : "off"}`;
    } else if (
      event.code === EditorKey.PlaybackPitchDown ||
      event.code === EditorKey.PlaybackPitchUp
    ) {
      // At the limit nothing changes; speaking the value still confirms the key.
      controller.shiftPlaybackPitch(
        event.code === EditorKey.PlaybackPitchUp ? 1 : -1
      );
      const value = controller.pitchShiftSemitones;
      message = `Playback pitch ${value > 0 ? `+${value}` : value} semitones`;
    } else {
      return false;
    }
    this._renderFunc();
    this._uiComponent.announce(message);
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

  /** True for Alt+key with no other modifier on a staff add or remove key. */
  private isStaffShortcut(event: KeyboardEvent): boolean {
    const staffCodes: readonly string[] = [
      EditorKey.AddStaffBelow,
      EditorKey.RemoveStaff,
    ];
    return (
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      staffCodes.includes(event.code)
    );
  }

  /** Moves between, adds, or removes staves; true means consume the key. */
  private staffShortcutEvent(code: string): boolean {
    const controller = this._notationComponent.trackController;
    const previous = captureSelectionCursor(controller.selectionCursor);
    let changed: boolean;
    if (code === EditorKey.StaffUp || code === EditorKey.StaffDown) {
      changed = controller.moveSelectionToStaff(
        code === EditorKey.StaffUp ? -1 : 1
      );
    } else if (!controller.canEdit) {
      return false;
    } else if (code === EditorKey.AddStaffBelow) {
      changed = controller.addStaffBelowSelected();
    } else {
      changed = controller.removeSelectedStaff();
    }
    if (!changed) {
      return false;
    }

    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
    this._announce(previous);
    return true;
  }

  /** Routes shared actions before editing; true means consume the key. */
  private dispatchShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    const { shiftKey } = event;
    const ctrlKey = event.ctrlKey || event.metaKey;
    const controller = this._notationComponent.trackController;

    // Each action asks the controller whether it is allowed now, so keys work
    // during playback exactly when their buttons do.
    if (this.dispatchTransportShortcut(event)) {
      return true;
    }

    if (this.isStaffShortcut(event)) {
      return this.staffShortcutEvent(event.code);
    }

    if (key === EditorKey.SelectAll && ctrlKey && !shiftKey) {
      if (!controller.selectAllBeats()) {
        return false;
      }
      this._renderFunc();
      return true;
    }

    if (key === EditorKey.CancelSelection && !ctrlKey && !shiftKey) {
      return this.cancelSelectionEvent();
    }

    if ((key === EditorKey.FirstBar || key === EditorKey.LastBar) && ctrlKey) {
      if (shiftKey) {
        return false;
      }
      this.jumpToBarEvent(key === EditorKey.FirstBar);
      return true;
    }

    if (KeyChecker.isArrow(key)) {
      // Alt+arrows belong to section focus and browser history.
      if (event.altKey) {
        return false;
      }
      const horizontal =
        key === EditorKey.MoveLeft || key === EditorKey.MoveRight;

      if (horizontal && shiftKey) {
        this.extendSelectionEvent(key, ctrlKey);
        return true;
      }
      if (horizontal && ctrlKey) {
        return this.moveSelectionByBarEvent(key);
      }
      if (!horizontal && ctrlKey && !shiftKey) {
        return this.staffShortcutEvent(
          key === EditorKey.MoveUp ? EditorKey.StaffUp : EditorKey.StaffDown
        );
      }
      if (!ctrlKey && !shiftKey) {
        this.moveSelectionEvent(key);
        return true;
      }
      if (!horizontal && shiftKey && !ctrlKey) {
        return (
          controller.canEdit &&
          this.shiftPitchEvent(key === EditorKey.MoveUp ? 1 : -1)
        );
      }
      return false;
    }

    return controller.canEdit && this.dispatchEditingShortcut(event);
  }

  /** Handles notation shortcuts and toolbar playback shortcuts. */
  public onKeyDown(event: KeyboardEvent): void {
    if (this.isSliderPlayback(event)) {
      event.preventDefault();
      if (!event.repeat) {
        this.togglePlaybackEvent();
      }
      return;
    }
    if (!this.isKeyboardEventEligible(event)) {
      return;
    }

    const activeElement = document.activeElement;
    const notationFocused = activeElement === this._notationComponent.rootDiv;
    const target = event.target ?? document.activeElement;
    const toolbarButton =
      typeof Element !== "undefined" && target instanceof Element
        ? target.closest("button")
        : null;
    const toolbarPlayback =
      event.key === EditorKey.TogglePlayback &&
      event.shiftKey &&
      !event.ctrlKey &&
      toolbarButton !== null &&
      this._rootElement.contains(toolbarButton) &&
      activeElement === toolbarButton;

    if (!notationFocused && !toolbarPlayback) {
      return;
    }

    if (toolbarPlayback) {
      event.preventDefault();
      if (!event.repeat) {
        // Keep focus in notation if playback disables the button.
        this._notationComponent.rootDiv.focus({ preventScroll: true });
        this.togglePlaybackEvent();
      }
      return;
    }

    if (
      notationFocused &&
      event.key === EditorKey.TogglePlayback &&
      !event.ctrlKey
    ) {
      event.preventDefault();
      if (!event.repeat) {
        this.togglePlaybackEvent();
      }
      return;
    }

    if (notationFocused && this.isClipboardShortcut(event)) {
      this.fallBackIfNoClipboardEvent(event.key.toLowerCase());
      return;
    }

    if (this.dispatchShortcut(event)) {
      event.preventDefault();
    }
  }

  /** True for Ctrl or Command with C, X, or V, and no other modifier. */
  private isClipboardShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    return (
      (key === EditorKey.Copy ||
        key === EditorKey.Cut ||
        key === EditorKey.Paste) &&
      Boolean(event.ctrlKey) !== Boolean(event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    );
  }

  /**
   * Lets the browser handle a clipboard shortcut with a clipboard event, and
   * falls back to the Clipboard API when no event fires.
   *
   * This exists only because of WebKit (Safari). The clipboard spec says
   * browsers fire copy, cut, and paste even when nothing is selected, and
   * Chromium and Firefox do. WebKit doesn't when a non-editable element, such
   * as notation, has focus and no text is selected. No reliable check tells
   * ahead of time, so this waits until the key is fully handled and checks
   * whether an event fired. In other browsers one always does, so the
   * fallback never runs there.
   */
  private fallBackIfNoClipboardEvent(key: string): void {
    this._clipboardEventFired = false;
    // The browser fires the clipboard event only after all keydown listeners
    // return, so check in a later task. A sync check or a microtask would run
    // before the event and always fall back.
    setTimeout(() => {
      if (!this._clipboardEventFired && this._bound) {
        this.clipboardShortcutFallback(key);
      }
    }, 0);
  }

  /**
   * Copies, cuts, or pastes with the Clipboard API. Before a read, Safari may
   * ask the user to confirm with a Paste button.
   */
  private clipboardShortcutFallback(key: string): void {
    const controller = this._notationComponent.trackController;
    if (
      document.activeElement !== this._notationComponent.rootDiv ||
      this._uiComponent.dialogEnforcer?.activeDialog ||
      (key !== EditorKey.Copy && !controller.canEdit)
    ) {
      return;
    }
    if (key === EditorKey.Paste) {
      void this.pasteFromClipboard();
      return;
    }
    const text = controller.copy();
    if (text !== undefined) {
      void this.writeToClipboard(text, key === EditorKey.Cut);
    }
  }

  /** Writes text for the fallback, then removes the beats for a cut. */
  private async writeToClipboard(text: string, cut: boolean): Promise<void> {
    if (!(await writeClipboardText(text))) {
      this._uiComponent.announce("The browser blocked clipboard access.");
      return;
    }
    if (cut) {
      this.deleteSelectionEvent();
    }
  }

  /** Reads and pastes text for the fallback. */
  private async pasteFromClipboard(): Promise<void> {
    const text = await readClipboardText();
    if (text === undefined) {
      this._uiComponent.announce("The browser blocked clipboard access.");
      return;
    }
    if (this._notationComponent.trackController.paste(text)) {
      this._renderFunc();
    }
  }

  /**
   * True for Space on an editor slider. Sliders keep focus after a drag and
   * have no Space action, so Space toggles playback there, as in notation.
   */
  private isSliderPlayback(event: KeyboardEvent): boolean {
    const target = event.target;
    return (
      event.key === EditorKey.TogglePlayback &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      typeof Element !== "undefined" &&
      target instanceof Element &&
      target.matches('input[type="range"]') &&
      this._rootElement.contains(target) &&
      target.closest("dialog, .tu-dialog") === null
    );
  }

  /** Checks the shared focus, ownership, and browser-control boundary. */
  private isKeyboardEventEligible(event: KeyboardEvent): boolean {
    const target = event.target ?? document.activeElement;
    if (typeof Element === "undefined" || !(target instanceof Element)) {
      return false;
    }
    if (!this._rootElement.contains(target)) {
      return false;
    }
    if (target.closest("dialog, .tu-dialog") !== null) {
      return false;
    }
    const contentEditable = target.closest("[contenteditable]");
    const interactive =
      target.closest("input, textarea, select, a") !== null ||
      (contentEditable !== null &&
        contentEditable.getAttribute("contenteditable") !== "false");
    if (interactive) {
      return false;
    }

    const key = event.key.toLowerCase();
    // Leave other Command shortcuts to the browser, never to bare-letter actions.
    const unsupportedMeta =
      event.metaKey &&
      (event.ctrlKey ||
        (key !== EditorKey.SelectAll &&
          key !== EditorKey.Undo &&
          !this.isClipboardShortcut(event)));
    if (
      event.defaultPrevented ||
      (event.altKey && !this.isStaffShortcut(event)) ||
      unsupportedMeta ||
      event.isComposing ||
      event.keyCode === 229 // Fallback for legacy browsers
    ) {
      return false;
    }

    if (this._uiComponent.dialogEnforcer?.activeDialog) {
      return false;
    }

    return key !== "tab" && !(key.length !== 1 && key[0] === "f");
  }

  /** Dispatches editing bindings only when their selection is available. */
  private dispatchEditingShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase();
    const { shiftKey } = event;
    const ctrlKey = event.ctrlKey || event.metaKey;
    const controller = this._notationComponent.trackController;
    if (!ctrlKey) {
      const barActions: readonly string[] = [
        EditorKey.RepeatStart,
        EditorKey.RepeatEndSettings,
      ];
      if (barActions.includes(key) && !controller.selectionCursor) {
        return false;
      }
      if (
        key === EditorKey.TempoSettings &&
        controller.selectionAsBeats.length === 0
      ) {
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
    const isDynamicShift =
      key === EditorKey.LouderDynamic || key === EditorKey.SofterDynamic;
    if (!ctrlKey && lengthen) {
      this.changeDurationEvent(true);
    } else if (!ctrlKey && isDynamicShift) {
      return this.shiftDynamicEvent(
        key === EditorKey.LouderDynamic
          ? DynamicDirection.Louder
          : DynamicDirection.Softer
      );
    } else if (ctrlKey && shiftKey) {
      if (key !== EditorKey.Undo) {
        return false;
      }
      this.redoEvent();
    } else if (ctrlKey) {
      if (key === EditorKey.Undo) {
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
      } else if (key === EditorKey.TieToEarliest) {
        return this.techniqueEvent(GuitarTechniqueType.Tie, {
          tieToEarliest: true,
        });
      } else if (key === EditorKey.PinchHarmonic) {
        return this.techniqueEvent(GuitarTechniqueType.PinchHarmonic);
      } else if (key === EditorKey.StrokeSettings) {
        return this.strokeSettingsEvent();
      } else if (key === EditorKey.HeavyAccent) {
        return this.accentEvent(AccentType.Heavy);
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
      } else if (key === EditorKey.Tie) {
        return this.techniqueEvent(GuitarTechniqueType.Tie);
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
      } else if (key === EditorKey.DownStroke) {
        return this.strokeEvent(StrokeDirection.Down);
      } else if (key === EditorKey.UpStroke) {
        return this.strokeEvent(StrokeDirection.Up);
      } else if (key === EditorKey.Tap) {
        return this.techniqueEvent(GuitarTechniqueType.Tap);
      } else if (key === EditorKey.Accent) {
        return this.accentEvent(AccentType.Normal);
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
    document.addEventListener("copy", this._boundOnCopy);
    document.addEventListener("cut", this._boundOnCut);
    document.addEventListener("paste", this._boundOnPaste);
    this._bound = true;
  }

  public unbind(): void {
    if (!this._bound) {
      return;
    }

    document.removeEventListener("keydown", this._boundOnKeyDown);
    document.removeEventListener("copy", this._boundOnCopy);
    document.removeEventListener("cut", this._boundOnCut);
    document.removeEventListener("paste", this._boundOnPaste);
    this._bound = false;
  }

  /** Accepts unhandled clipboard events while notation has focus and no dialog is active. */
  private clipboardEventEligible(event: ClipboardEvent): boolean {
    return (
      document.activeElement === this._notationComponent.rootDiv &&
      !event.defaultPrevented &&
      !this._uiComponent.dialogEnforcer?.activeDialog
    );
  }

  private onCopy(event: ClipboardEvent): void {
    this._clipboardEventFired = true;
    if (!this.clipboardEventEligible(event) || event.clipboardData === null) {
      return;
    }
    const text = this._notationComponent.trackController.copy();
    if (text === undefined) {
      return;
    }

    event.preventDefault();
    event.clipboardData.clearData();
    event.clipboardData.setData("text/plain", text);
  }

  /** Writes the selection before using the same beat removal action as Delete. */
  private onCut(event: ClipboardEvent): void {
    this._clipboardEventFired = true;
    if (!this.clipboardEventEligible(event) || event.clipboardData === null) {
      return;
    }
    const tc = this._notationComponent.trackController;
    if (!tc.canEdit) {
      return;
    }
    const clipboardText = tc.copy();
    if (clipboardText === undefined) {
      return;
    }

    event.clipboardData.clearData();
    event.clipboardData.setData("text/plain", clipboardText);
    event.preventDefault();
    this.deleteSelectionEvent();
  }

  private onPaste(event: ClipboardEvent): void {
    this._clipboardEventFired = true;
    if (!this.clipboardEventEligible(event) || event.clipboardData === null) {
      return;
    }
    const controller = this._notationComponent.trackController;
    if (!controller.canEdit) {
      return;
    }

    const text = event.clipboardData.getData("text/plain");
    const pasteAccepted = controller.paste(text);
    if (pasteAccepted) {
      event.preventDefault();
      this._renderFunc();
    }
  }
}
