import {
  BendTechniqueOptions,
  GuitarTechniqueType,
  NoteValue,
} from "@/notation/model";
import { SelectedMoveDirection } from "@/notation/controller";
import { NotationComponent } from "@/notation/notation-component";
import { KeyChecker } from "@/shared";
import { UIComponent } from "@/ui";

export interface EditorKeyboardCallbacks {
  ctrlCEvent(event: KeyboardEvent): void;
  ctrlVEvent(event: KeyboardEvent): void;
  ctrlZEvent(event: KeyboardEvent): void;
  ctrlYEvent(event: KeyboardEvent): void;
  deleteEvent(event: KeyboardEvent): void;
  setTechnique(
    type: GuitarTechniqueType,
    bendOptions?: BendTechniqueOptions
  ): void;
  shiftVEvent(event: KeyboardEvent): void;
  shiftPEvent(event: KeyboardEvent): void;
  shiftBEvent(event: KeyboardEvent): void;
  spaceEvent(event: KeyboardEvent): void;
  onNumberDown(key: string): void;
  onArrowDown(key: string): void;
  onBackspacePress(): void;
  onCtrlDel(): void;
  onKeyDown(event: KeyboardEvent): void;
  bind(): void;
  unbind(): void;
}

export class EditorKeyboardDefCallbacks implements EditorKeyboardCallbacks {
  readonly eventsTimeEpsilon: number = 250;

  private _uiComponent: UIComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _bound: boolean = false;
  private _prevKeyPress?: { time: number; key: string };
  private _boundOnKeyDown?: (event: KeyboardEvent) => void;

  constructor(
    uiComponent: UIComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._uiComponent = uiComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  public ctrlCEvent(event: KeyboardEvent): void {
    this._notationComponent.trackController.copy();
  }

  public ctrlVEvent(event: KeyboardEvent): void {
    this._notationComponent.trackController.paste();
    this._renderFunc();
  }

  public ctrlZEvent(event: KeyboardEvent): void {
    this._notationComponent.trackController.undo();
    this._renderFunc();
  }

  public ctrlYEvent(event: KeyboardEvent): void {
    this._notationComponent.trackController.redo();
    this._renderFunc();
  }

  public deleteEvent(event: KeyboardEvent): void {
    this._notationComponent.trackController.deleteSelectedBeats();
    this._renderFunc();
  }

  public setTechnique(
    type: GuitarTechniqueType,
    bendOptions?: BendTechniqueOptions
  ): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }

    this._notationComponent.trackController.setTechnique(type, bendOptions);

    this._renderFunc();
  }

  public shiftVEvent(event: KeyboardEvent): void {
    this.setTechnique(GuitarTechniqueType.Vibrato);
  }

  public shiftPEvent(event: KeyboardEvent): void {
    this.setTechnique(GuitarTechniqueType.PalmMute);
  }

  public shiftBEvent(event: KeyboardEvent): void {
    void event;
    this._uiComponent.sideComponent.techniqueControlsComponent.showBendControls();
  }

  public spaceEvent(event: KeyboardEvent): void {
    if (this._notationComponent.trackController.isPlaying) {
      this._notationComponent.trackController.stopPlayer();
    } else {
      this._notationComponent.trackController.startPlayer();
    }

    this._renderFunc();
  }

  public onNumberDown(key: string): void {
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

  public onArrowDown(key: string): void {
    if (!this._notationComponent.trackController.hasSelectedNote) {
      return;
    }

    switch (key) {
      case "arrowdown":
        this._notationComponent.trackController.moveSelectedNote(
          SelectedMoveDirection.Down
        );
        break;
      case "arrowup":
        this._notationComponent.trackController.moveSelectedNote(
          SelectedMoveDirection.Up
        );
        break;
      case "arrowleft":
        this._notationComponent.trackController.moveSelectedNote(
          SelectedMoveDirection.Left
        );
        break;
      case "arrowright":
        this._notationComponent.trackController.moveSelectedNote(
          SelectedMoveDirection.Right
        );
        break;
    }

    this._renderFunc();
  }

  public onBackspacePress(): void {
    const selectedNote = this._notationComponent.trackController.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    if (selectedNote.note.noteValue === NoteValue.None) {
      return;
    }

    this._notationComponent.trackController.setSelectedNoteFret(null);

    this._renderFunc();
  }

  public onCtrlDel(): void {}

  public onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase(); // normalize
    if (key.length !== 1 && key[0] === "f") {
      return;
    }

    event.preventDefault();

    if (event.ctrlKey && !event.shiftKey) {
      if (key === "c") {
        this.ctrlCEvent(event);
      } else if (key === "v") {
        this.ctrlVEvent(event);
      } else if (key === "z") {
        this.ctrlZEvent(event);
      } else if (key === "y") {
        this.ctrlYEvent(event);
      }
    } else if (!event.ctrlKey && event.shiftKey) {
      if (key === "v") {
        this.shiftVEvent(event);
      } else if (key === "p") {
        this.shiftPEvent(event);
      } else if (key === "b") {
        this.shiftBEvent(event);
      }
    } else if (!event.ctrlKey && !event.shiftKey) {
      if (key === "delete") {
        this.deleteEvent(event);
      } else if (key === " ") {
        this.spaceEvent(event);
      } else if (KeyChecker.isNumber(key)) {
        this.onNumberDown(key);
      } else if (KeyChecker.isArrow(key)) {
        this.onArrowDown(key);
      } else if (KeyChecker.isBackspace(key)) {
        this.onBackspacePress();
      }
    }
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
    if (this._bound && this._boundOnKeyDown !== undefined) {
      document.removeEventListener("keydown", this._boundOnKeyDown);
      this._boundOnKeyDown = undefined;
      this._bound = false;
    }
  }
}
