import { GuitarEffectOptions } from "../../../models/index";
import { GuitarEffectType } from "../../../models/index";
import { SelectedMoveDirection } from "../../elements/selected-element";
import { Point } from "../../shapes/point";
import { TabWindow } from "../../tab-window";
import { KeyChecker } from "../../../misc/key-checker";

/**
 * Events that i can react to:
 * - Mouse events
 * - Keyboard press events
 *
 * For mouse events:
 * - Mouse event for every note
 * - Mouse event for every beat
 *
 * For keyboard press events:
 * -
 */

/**
 *
 */
export class TabWindowDefCallbacks {
  readonly eventsTimeEpsilon: number = 250;

  private _tabWindow: TabWindow;

  private _selectionStartPoint?: Point;
  private _selectingBeats: boolean;

  private _prevKeyPress?: { time: number; key: string };

  constructor(tabWindow: TabWindow) {
    this._tabWindow = tabWindow;

    this._selectingBeats = false;
  }

  onNoteDurationClick(duration: number): void {
    // Check if any note is selected
    const selected = this._tabWindow.getSelectedElement();
    const selectionBeats = this._tabWindow.getSelectionBeats();

    if (selected === undefined && selectionBeats.length === 0) {
      return;
    }

    if (selected !== undefined) {
      this._tabWindow.changeSelectedBeatDuration(duration);
    } else if (selectionBeats.length !== 0) {
      this._tabWindow.changeSelectionDuration(duration);
    }
  }

  onBeatsChanged(barBeats: number): void {
    // Check if any note is selected
    if (!this._tabWindow.getSelectedElement()) {
      return;
    }

    this._tabWindow.changeSelectedBarBeats(barBeats);
  }

  onDurationChanged(duration: number): void {
    // Check if any note is selected
    if (!this._tabWindow.getSelectedElement()) {
      return;
    }

    this._tabWindow.changeSelectedBarDuration(1 / duration);
  }

  onTempoChanged(tempo: number): void {
    // Check if any note is selected
    if (!this._tabWindow.getSelectedElement()) {
      return;
    }

    this._tabWindow.changeSelectedBarTempo(tempo);
  }

  onNoteClick(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    noteElementId: number
  ): void {
    this._tabWindow.selectNoteElementUsingIds(
      tabLineElementId,
      barElementId,
      beatElementId,
      noteElementId
    );
  }

  onBeatMouseDown(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    this._tabWindow.clearSelection();
    this._tabWindow.recalcBeatElementSelection();
    this._selectingBeats = true;
    // this._tabWindow.selectBeat(barElementsLineId, barElementId, beatElementId);
    console.log("onBeatMouseDown");
  }

  onBeatMouseEnter(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    if (this._selectingBeats) {
      this._tabWindow.selectBeatUsingIds(
        tabLineElementId,
        barElementId,
        beatElementId
      );
    }
  }

  onBeatMouseLeave(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    if (this._selectingBeats) {
      // console.log(
      //   `L: ${barElementsLineId}, ${barElementId}, ${beatElementId}`
      // );
    }
  }

  onBeatMouseMove(
    event: MouseEvent,
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    if (this._selectingBeats) {
      if (this._tabWindow.getSelectionBeats().length === 0) {
        if (this._selectionStartPoint === undefined) {
          this._selectionStartPoint = new Point(event.pageX, event.pageY);
        } else {
          const dx = event.pageX - this._selectionStartPoint.x;
          const dy = event.pageY - this._selectionStartPoint.y;
          const distMoved = Math.sqrt(dx * dx + dy * dy);

          const lines = this._tabWindow.getTabLineElements();
          const beatElement =
            lines[tabLineElementId].barElements[barElementId].beatElements[
              beatElementId
            ];
          const rect = beatElement.rect;

          if (distMoved >= rect.width / 4) {
            this._tabWindow.selectBeatUsingIds(
              tabLineElementId,
              barElementId,
              beatElementId
            );
          }
        }
      }
    }
  }

  onBeatMouseUp(): void {
    this._selectingBeats = false;
    this._selectionStartPoint = undefined;
  }

  // @HostListener("document:keydown.control.c", ["$event"])
  ctrlCEvent(event: KeyboardEvent): void {
    // this.copyingStarted = true;
    this._tabWindow.copy();
  }

  // @HostListener("document:keydown.control.v", ["$event"])
  ctrlVEvent(event: KeyboardEvent): void {
    // console.log(JSON.parse(JSON.stringify(this._tabWindow)));
    this._tabWindow.paste();
    // console.log(JSON.parse(JSON.stringify(this._tabWindow)));
    // this.copyingStarted = false;
  }

  // @HostListener("document:keydown.control.z", ["$event"])
  ctrlZEvent(event: KeyboardEvent): void {
    this._tabWindow.undo();
  }

  // @HostListener("document:keydown.control.y", ["$event"])
  ctrlYEvent(event: KeyboardEvent): void {
    this._tabWindow.redo();
  }

  // @HostListener("document:keydown.delete", ["$event"])
  deleteEvent(event: KeyboardEvent): void {
    this._tabWindow.deleteSelectedBeats();
  }

  private applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void {
    const selected = this._tabWindow.getSelectedElement();

    if (selected !== undefined) {
      const effectIndex = selected.note.effects.findIndex((e) => {
        return e.effectType === effectType;
      });

      if (effectIndex === -1) {
        console.log("APPLYING EFFECT");
        const result = this._tabWindow.applyEffectSingle(effectType, options);
        console.log(`APPLY RESULT: ${result}`);
      } else {
        this._tabWindow.removeEffectSingle(effectType, options);
      }
    }
  }

  // @HostListener("document:keydown.shift.v", ["$event"])
  shiftVEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.Vibrato);
  }

  // @HostListener("document:keydown.shift.p", ["$event"])
  shiftPEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.PalmMute);
  }

  // @HostListener("document:keydown.shift.b", ["$event"])
  shiftBEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.Bend, new GuitarEffectOptions(1));
  }

  // @HostListener("document:keydown.space", ["$event"])
  spaceEvent(event: KeyboardEvent): void {
    if (this._tabWindow.getIsPlaying()) {
      this._tabWindow.stopPlayer();
    } else {
      this._tabWindow.startPlayer();
    }
  }

  onNumberDown(key: string): void {
    // Check if any note is selected
    if (!this._tabWindow.getSelectedElement()) {
      return;
    }

    // Check if a valid key has been pressed
    let newFret = Number.parseInt(key);
    if (Number.isNaN(newFret)) {
      return;
    }

    // Check if this is the first note click
    if (!this._prevKeyPress) {
      this._prevKeyPress = { time: new Date().getTime(), key: key };
      this._tabWindow.setSelectedElementFret(newFret);
      return;
    }

    // Calculate time difference
    let now = new Date().getTime();
    let timeDiff = now - this._prevKeyPress.time;
    let combFret = Number.parseInt(this._prevKeyPress.key + key);
    newFret = timeDiff < this.eventsTimeEpsilon ? combFret : newFret;
    // Set fret
    this._tabWindow.setSelectedElementFret(newFret);

    // Update prev tab key press object
    this._prevKeyPress.time = now;
    this._prevKeyPress.key = key;
  }

  onArrowDown(key: string): void {
    // Check if a note is selected
    if (!this._tabWindow.getSelectedElement()) {
      return;
    }

    switch (key) {
      case "ArrowDown":
        this._tabWindow.moveSelectedNote(SelectedMoveDirection.Down);
        break;
      case "ArrowUp":
        this._tabWindow.moveSelectedNote(SelectedMoveDirection.Up);
        break;
      case "ArrowLeft":
        this._tabWindow.moveSelectedNote(SelectedMoveDirection.Left);
        break;
      case "ArrowRight":
        this._tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
        break;
    }
  }

  onBackspacePress(): void {
    const selected = this._tabWindow.getSelectedElement();

    if (!selected) {
      return;
    }

    if (!selected.note.fret) {
      return;
    }

    this._tabWindow.setSelectedElementFret(undefined);
  }

  onCtrlDel(): void {
    // Delete selected note beat
  }

  onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    let key = event.key;

    if (KeyChecker.isNumber(key)) {
      this.onNumberDown(key);
    } else if (KeyChecker.isArrow(key)) {
      this.onArrowDown(key);
    } else if (KeyChecker.isBackspace(key)) {
      this.onBackspacePress();
    }
  }
}
