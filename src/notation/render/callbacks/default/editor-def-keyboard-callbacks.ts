import { SelectedMoveDirection, TabController } from "@/notation/element";
import { GuitarEffectType, GuitarEffectOptions } from "@/notation/model";
import { KeyChecker } from "@/shared";
import { BendSelectorManager } from "@/ui/side-controls/effect-controls/bend-controls/bend-selectors";
import { EditorKeyboardCallbacks } from "../editor-keyboard-callbacks";
import { EditorRenderer } from "../../editor-renderer";
import { ElementRenderer } from "../../element-renderer";

export class EditorKeyboardDefCallbacks implements EditorKeyboardCallbacks {
  readonly eventsTimeEpsilon: number = 250;

  readonly renderer: EditorRenderer;
  readonly controller: TabController;
  readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  private _bendSelectorManager?: BendSelectorManager;

  private _prevKeyPress?: { time: number; key: string };

  constructor(
    renderer: EditorRenderer,
    controller: TabController,
    bindAfterRender: (activeRenderers: ElementRenderer[]) => void,
    bendSelectorManager?: BendSelectorManager
  ) {
    this.renderer = renderer;
    this.controller = controller;
    this.bindAfterRender = bindAfterRender;
    this._bendSelectorManager = bendSelectorManager;
  }

  public ctrlCEvent(event: KeyboardEvent): void {
    console.log("ctrCEvent");
    this.controller.copy();
  }

  public ctrlVEvent(event: KeyboardEvent): void {
    console.log("ctrlVEvent");
    this.controller.paste();

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public ctrlZEvent(event: KeyboardEvent): void {
    console.log("ctrlZEvent");
    this.controller.undo();

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public ctrlYEvent(event: KeyboardEvent): void {
    console.log("ctrlYEvent");
    this.controller.redo();

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public deleteEvent(event: KeyboardEvent): void {
    this.controller.deleteSelectedBeats();

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void {
    const selected = this.controller.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    const effectIndex = selected.note.effects.findIndex((e) => {
      return e.effectType === effectType;
    });

    if (effectIndex === -1) {
      const result = this.controller.applyEffectSingle(effectType, options);
    } else {
      this.controller.removeEffectSingle(effectType, options);
    }

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public shiftVEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.Vibrato);
  }

  public shiftPEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.PalmMute);
  }

  public shiftBEvent(event: KeyboardEvent): void {
    event.preventDefault();

    if (this._bendSelectorManager === undefined) {
      return;
    }

    this._bendSelectorManager.show(
      (effectType: GuitarEffectType, options: GuitarEffectOptions) => {
        this.applyOrRemoveEffect(effectType, options);
      }
    );
  }

  public spaceEvent(event: KeyboardEvent): void {
    if (this.controller.getIsPlaying()) {
      this.controller.stopPlayer();
    } else {
      this.controller.startPlayer();
    }

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onNumberDown(key: string): void {
    if (this.controller.getSelectedElement() === undefined) {
      return;
    }

    let newFret = Number.parseInt(key);
    if (Number.isNaN(newFret)) {
      return;
    }

    if (this._prevKeyPress === undefined) {
      this._prevKeyPress = { time: new Date().getTime(), key: key };
      this.controller.setSelectedElementFret(newFret);

      this.bindAfterRender(this.renderer.render(this.controller));
      return;
    }

    let now = new Date().getTime();
    let timeDiff = now - this._prevKeyPress.time;
    let combFret = Number.parseInt(this._prevKeyPress.key + key);
    newFret = timeDiff < this.eventsTimeEpsilon ? combFret : newFret;

    this.controller.setSelectedElementFret(newFret);

    this._prevKeyPress.time = now;
    this._prevKeyPress.key = key;

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onArrowDown(key: string): void {
    if (this.controller.getSelectedElement() === undefined) {
      return;
    }

    switch (key) {
      case "arrowdown":
        this.controller.moveSelectedNote(SelectedMoveDirection.Down);
        break;
      case "arrowup":
        this.controller.moveSelectedNote(SelectedMoveDirection.Up);
        break;
      case "arrowleft":
        this.controller.moveSelectedNote(SelectedMoveDirection.Left);
        break;
      case "arrowright":
        this.controller.moveSelectedNote(SelectedMoveDirection.Right);
        break;
    }

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onBackspacePress(): void {
    const selected = this.controller.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    if (selected.note.fret === undefined) {
      return;
    }

    this.controller.setSelectedElementFret(undefined);

    this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onCtrlDel(): void {
    // Delete selected note beat
  }

  public onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    const key = event.key.toLowerCase(); // normalize
    if (key.length !== 1 && key[0] === "f") {
      return;
    }

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
      if (key === "Delete") {
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
}
