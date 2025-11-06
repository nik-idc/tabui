import { EditorRenderer } from "@/notation";
import { SelectedMoveDirection, TabController } from "@/notation/element";
import { GuitarEffectType, GuitarEffectOptions } from "@/notation/model";
import { NotationComponent } from "@/notation/notation-component";
import { ElementRenderer } from "@/notation/render/element-renderer";
import { KeyChecker } from "@/shared";
import { UIComponent } from "@/ui";

export interface EditorKeyboardCallbacks {
  // readonly renderer: EditorRenderer;
  // readonly controller: TabController;
  // readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  readonly uiComponent: UIComponent;
  readonly notationComponent: NotationComponent;

  ctrlCEvent(event: KeyboardEvent): void;
  ctrlVEvent(event: KeyboardEvent): void;
  ctrlZEvent(event: KeyboardEvent): void;
  ctrlYEvent(event: KeyboardEvent): void;
  deleteEvent(event: KeyboardEvent): void;
  applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
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
}

export class EditorKeyboardDefCallbacks implements EditorKeyboardCallbacks {
  readonly eventsTimeEpsilon: number = 250;

  // readonly renderer: EditorRenderer;
  // readonly controller: TabController;
  // readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  readonly uiComponent: UIComponent;
  readonly notationComponent: NotationComponent;

  // private _bendSelectorManager?: BendSelectorManager;

  private _bound: boolean = false;
  private _prevKeyPress?: { time: number; key: string };

  constructor(
    // renderer: EditorRenderer,
    // controller: TabController,
    // bindAfterRender: (activeRenderers: ElementRenderer[]) => void,
    // bendSelectorManager?: BendSelectorManager

    uiComponent: UIComponent,
    notationComponent: NotationComponent
  ) {
    this.uiComponent = uiComponent;
    this.notationComponent = notationComponent;

    // this.renderer = renderer;
    // this.controller = controller;
    // this.bindAfterRender = bindAfterRender;
    // this._bendSelectorManager = bendSelectorManager;
  }

  public ctrlCEvent(event: KeyboardEvent): void {
    this.notationComponent.tabController.copy();

    // this.controller.copy();
  }

  public ctrlVEvent(event: KeyboardEvent): void {
    this.notationComponent.tabController.paste();
    this.notationComponent.render();

    // this.controller.paste();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public ctrlZEvent(event: KeyboardEvent): void {
    this.notationComponent.tabController.undo();
    this.notationComponent.render();

    // this.controller.undo();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public ctrlYEvent(event: KeyboardEvent): void {
    this.notationComponent.tabController.redo();
    this.notationComponent.render();

    // this.controller.redo();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public deleteEvent(event: KeyboardEvent): void {
    this.notationComponent.tabController.deleteSelectedBeats();
    this.notationComponent.render();

    // this.controller.deleteSelectedBeats();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public applyOrRemoveEffect(
    effectType: GuitarEffectType,
    options?: GuitarEffectOptions
  ): void {
    const selected = this.notationComponent.tabController.getSelectedElement();

    // const selected = this.controller.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    const effectIndex = selected.note.effects.findIndex((e) => {
      return e.effectType === effectType;
    });

    if (effectIndex === -1) {
      const result = this.notationComponent.tabController.applyEffectSingle(
        effectType,
        options
      );

      // const result = this.controller.applyEffectSingle(effectType, options);
    } else {
      this.notationComponent.tabController.removeEffectSingle(
        effectType,
        options
      );

      // this.controller.removeEffectSingle(effectType, options);
    }

    this.notationComponent.render();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public shiftVEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.Vibrato);
  }

  public shiftPEvent(event: KeyboardEvent): void {
    this.applyOrRemoveEffect(GuitarEffectType.PalmMute);
  }

  public shiftBEvent(event: KeyboardEvent): void {
    // event.preventDefault();

    // if (this._bendSelectorManager === undefined) {
    //   return;
    // }

    // this._bendSelectorManager.show(
    //   (effectType: GuitarEffectType, options: GuitarEffectOptions) => {
    //     this.applyOrRemoveEffect(effectType, options);
    //   }
    // );
    throw new Error("Method not implemented yet");
  }

  public spaceEvent(event: KeyboardEvent): void {
    if (this.notationComponent.tabController.getIsPlaying()) {
      this.notationComponent.tabController.stopPlayer();
    } else {
      this.notationComponent.tabController.startPlayer();
    }

    this.notationComponent.render();

    // if (this.controller.getIsPlaying()) {
    //   this.controller.stopPlayer();
    // } else {
    //   this.controller.startPlayer();
    // }

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onNumberDown(key: string): void {
    // if (this.controller.getSelectedElement() === undefined) {
    if (
      this.notationComponent.tabController.getSelectedElement() === undefined
    ) {
      return;
    }

    let newFret = Number.parseInt(key);
    if (Number.isNaN(newFret)) {
      return;
    }

    if (this._prevKeyPress === undefined) {
      this._prevKeyPress = { time: new Date().getTime(), key: key };
      this.notationComponent.tabController.setSelectedElementFret(newFret);

      // this.controller.setSelectedElementFret(newFret);

      this.notationComponent.render();
      // this.bindAfterRender(this.renderer.render(this.controller));
      return;
    }

    let now = new Date().getTime();
    let timeDiff = now - this._prevKeyPress.time;
    let combFret = Number.parseInt(this._prevKeyPress.key + key);
    newFret = timeDiff < this.eventsTimeEpsilon ? combFret : newFret;

    this.notationComponent.tabController.setSelectedElementFret(newFret);

    // this.controller.setSelectedElementFret(newFret);

    this._prevKeyPress.time = now;
    this._prevKeyPress.key = key;

    this.notationComponent.render();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onArrowDown(key: string): void {
    // if (this.controller.getSelectedElement() === undefined) {
    if (
      this.notationComponent.tabController.getSelectedElement() === undefined
    ) {
      return;
    }

    switch (key) {
      case "arrowdown":
        // this.controller.moveSelectedNote(SelectedMoveDirection.Down);
        this.notationComponent.tabController.moveSelectedNote(
          SelectedMoveDirection.Down
        );
        break;
      case "arrowup":
        // this.controller.moveSelectedNote(SelectedMoveDirection.Up);
        this.notationComponent.tabController.moveSelectedNote(
          SelectedMoveDirection.Up
        );
        break;
      case "arrowleft":
        // this.controller.moveSelectedNote(SelectedMoveDirection.Left);
        this.notationComponent.tabController.moveSelectedNote(
          SelectedMoveDirection.Left
        );
        break;
      case "arrowright":
        // this.controller.moveSelectedNote(SelectedMoveDirection.Right);
        this.notationComponent.tabController.moveSelectedNote(
          SelectedMoveDirection.Right
        );
        break;
    }

    this.notationComponent.render();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onBackspacePress(): void {
    const selected = this.notationComponent.tabController.getSelectedElement();
    // const selected = this.controller.getSelectedElement();

    if (selected === undefined) {
      return;
    }

    if (selected.note.fret === undefined) {
      return;
    }

    this.notationComponent.tabController.setSelectedElementFret(undefined);

    // this.controller.setSelectedElementFret(undefined);

    this.notationComponent.render();

    // this.bindAfterRender(this.renderer.render(this.controller));
  }

  public onCtrlDel(): void {
    // Delete selected note beat
  }

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

  public bind(): void {
    if (this._bound) {
      // if (this._keyboardBound) {
      return;
    }

    // this._boundOnKeyDown = keyboardCallbacks.onKeyDown.bind(keyboardCallbacks);
    document.addEventListener("keydown", this.onKeyDown.bind(this));
    // this._keyboardBound = true;
    this._bound = true;
  }
}
