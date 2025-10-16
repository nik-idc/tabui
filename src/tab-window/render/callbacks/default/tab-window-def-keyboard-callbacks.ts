import { KeyChecker } from "../../../../misc/key-checker";
import { GuitarEffectOptions } from "../../../../models/index";
import { GuitarEffectType } from "../../../../models/index";
import { SelectedMoveDirection } from "../../../elements/selected-element";
import { BendSelectorManager } from "../../bend-selectors/bend-selector-manager";
import { TabWindowSVGRenderer } from "../../tab-window-svg-renderer";
import { TabWindowKeyboardCallbacks } from "../tab-window-keyboard-callbacks";
import { SVGBarRenderer } from "../../svg/svg-bar-renderer";
import { SVGBeatRenderer } from "../../svg/svg-beat-renderer";
import { SVGNoteRenderer } from "../../svg/svg-note-renderer";

export class TabWindowKeyboardDefCallbacks
  implements TabWindowKeyboardCallbacks
{
  readonly eventsTimeEpsilon: number = 250;

  private _renderer: TabWindowSVGRenderer;
  private _renderAndBind: (
    activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ) => void;
  private _bendSelectorManager: BendSelectorManager;

  private _prevKeyPress?: { time: number; key: string };

  constructor(
    renderer: TabWindowSVGRenderer,
    renderAndBind: (
      activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
    ) => void,
    bendSelectorManager: BendSelectorManager
  ) {
    this._renderer = renderer;
    this._renderAndBind = renderAndBind;
    this._bendSelectorManager = bendSelectorManager;
  }

  public ctrlCEvent(event: KeyboardEvent): void {
    console.log("ctrCEvent");
    this._renderer.tabWindow.copy();
  }

  public ctrlVEvent(event: KeyboardEvent): void {
    console.log("ctrlVEvent");
    this._renderer.tabWindow.paste();
    this._renderAndBind(this._renderer.render());
  }

  public ctrlZEvent(event: KeyboardEvent): void {
    console.log("ctrlZEvent");
    this._renderer.tabWindow.undo();
    this._renderAndBind(this._renderer.render());
  }

  public ctrlYEvent(event: KeyboardEvent): void {
    console.log("ctrlYEvent");
    this._renderer.tabWindow.redo();
    this._renderAndBind(this._renderer.render());
  }

  public deleteEvent(event: KeyboardEvent): void {
    this._renderer.tabWindow.deleteSelectedBeats();
    this._renderAndBind(this._renderer.render());
  }

  public applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void {
    const selected = this._renderer.tabWindow.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    const effectIndex = selected.note.effects.findIndex((e) => {
      return e.effectType === effectType;
    });

    if (effectIndex === -1) {
      console.log("APPLYING EFFECT");
      const result = this._renderer.tabWindow.applyEffectSingle(
        effectType,
        options
      );
      console.log(`APPLY RESULT: ${result}`);
    } else {
      this._renderer.tabWindow.removeEffectSingle(effectType, options);
    }

    this._renderAndBind(this._renderer.render());
  }

  public shiftVEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.Vibrato);
  }

  public shiftPEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.PalmMute);
  }

  public shiftBEvent(event: KeyboardEvent): void {
    event.preventDefault();
    this._bendSelectorManager.show(
      (effectType: GuitarEffectType, options: GuitarEffectOptions) => {
        this.applyOrRemoveEffect(effectType, options);
      }
    );
  }

  public spaceEvent(event: KeyboardEvent): void {
    if (this._renderer.tabWindow.getIsPlaying()) {
      this._renderer.tabWindow.stopPlayer();
    } else {
      this._renderer.tabWindow.startPlayer();
    }
    this._renderAndBind(this._renderer.render());
  }

  public onNumberDown(key: string): void {
    if (this._renderer.tabWindow.getSelectedElement() === undefined) {
      return;
    }

    let newFret = Number.parseInt(key);
    if (Number.isNaN(newFret)) {
      return;
    }

    if (this._prevKeyPress === undefined) {
      this._prevKeyPress = { time: new Date().getTime(), key: key };
      this._renderer.tabWindow.setSelectedElementFret(newFret);
      this._renderAndBind(this._renderer.render());
      return;
    }

    let now = new Date().getTime();
    let timeDiff = now - this._prevKeyPress.time;
    let combFret = Number.parseInt(this._prevKeyPress.key + key);
    newFret = timeDiff < this.eventsTimeEpsilon ? combFret : newFret;

    this._renderer.tabWindow.setSelectedElementFret(newFret);

    this._prevKeyPress.time = now;
    this._prevKeyPress.key = key;
    this._renderAndBind(this._renderer.render());
  }

  public onArrowDown(key: string): void {
    if (this._renderer.tabWindow.getSelectedElement() === undefined) {
      return;
    }

    switch (key) {
      case "ArrowDown":
        this._renderer.tabWindow.moveSelectedNote(SelectedMoveDirection.Down);
        break;
      case "ArrowUp":
        this._renderer.tabWindow.moveSelectedNote(SelectedMoveDirection.Up);
        break;
      case "ArrowLeft":
        this._renderer.tabWindow.moveSelectedNote(SelectedMoveDirection.Left);
        break;
      case "ArrowRight":
        this._renderer.tabWindow.moveSelectedNote(SelectedMoveDirection.Right);
        break;
    }
    this._renderAndBind(this._renderer.render());
  }

  public onBackspacePress(): void {
    const selected = this._renderer.tabWindow.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    if (selected.note.fret === undefined) {
      return;
    }

    this._renderer.tabWindow.setSelectedElementFret(undefined);
    this._renderAndBind(this._renderer.render());
  }

  public onCtrlDel(): void {
    // Delete selected note beat
  }

  public onKeyDown(event: KeyboardEvent): void {
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
