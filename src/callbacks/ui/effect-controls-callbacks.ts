import { NotationComponent } from "@/notation/notation-component";
import { GuitarEffectType, TabController } from "@/notation";
import {
  BendControlsTemplate,
  BendSelectorManager,
  EffectControlsComponent,
  EffectControlsTemplate,
} from "@/ui";
import {
  BendControlsCallbacks,
  BendControlsDefaultCallbacks,
} from "./bend-controls-callbacks";
import { ListenerManager } from "@/shared/misc";

export interface EffectControlsCallbacks {
  onVibratoClicked(): void;
  onPalmMuteClicked(): void;
  onNHClicked(): void;
  onPHClicked(): void;
  onHammerOnClicked(): void;
  onPullOffClicked(): void;
  onSlideClicked(): void;
  onBendClicked(): void;
  bind(): void;
  unbind(): void;
}

export class EffectControlsDefaultCallbacks implements EffectControlsCallbacks {
  private _effectsComponent: EffectControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  private _bendCallbacks: BendControlsCallbacks;

  constructor(
    effectsComponent: EffectControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._effectsComponent = effectsComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._bendCallbacks = new BendControlsDefaultCallbacks(
      this._effectsComponent.bendControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
  }

  public onVibratoClicked(): void {
    this._notationComponent.tabController.setEffect(GuitarEffectType.Vibrato);
    this._renderFunc();
  }

  public onPalmMuteClicked(): void {
    this._notationComponent.tabController.setEffect(GuitarEffectType.PalmMute);
    this._renderFunc();
  }

  public onNHClicked(): void {
    this._notationComponent.tabController.setEffect(
      GuitarEffectType.NaturalHarmonic
    );
    this._renderFunc();
  }

  public onPHClicked(): void {
    this._notationComponent.tabController.setEffect(
      GuitarEffectType.PinchHarmonic
    );
    this._renderFunc();
  }

  public onHammerOnClicked(): void {
    this._notationComponent.tabController.setEffect(
      GuitarEffectType.HammerOnOrPullOff
    );
    this._renderFunc();
  }

  public onPullOffClicked(): void {
    this._notationComponent.tabController.setEffect(
      GuitarEffectType.HammerOnOrPullOff
    );
    this._renderFunc();
  }

  public onSlideClicked(): void {
    this._notationComponent.tabController.setEffect(GuitarEffectType.Slide);
    this._renderFunc();
  }

  public onBendClicked(): void {
    this._effectsComponent.showBendControls();
  }

  public bind(): void {
    this._listeners.bindAll([
      {
        element: this._effectsComponent.template.vibratoButton,
        event: "click",
        handler: () => this.onVibratoClicked(),
      },
      {
        element: this._effectsComponent.template.palmMuteButton,
        event: "click",
        handler: () => this.onPalmMuteClicked(),
      },
      {
        element: this._effectsComponent.template.nhButton,
        event: "click",
        handler: () => this.onNHClicked(),
      },
      {
        element: this._effectsComponent.template.phButton,
        event: "click",
        handler: () => this.onPHClicked(),
      },
      {
        element: this._effectsComponent.template.hammerOnButton,
        event: "click",
        handler: () => this.onHammerOnClicked(),
      },
      {
        element: this._effectsComponent.template.pullOffButton,
        event: "click",
        handler: () => this.onPullOffClicked(),
      },
      {
        element: this._effectsComponent.template.slideButton,
        event: "click",
        handler: () => this.onSlideClicked(),
      },
      {
        element: this._effectsComponent.template.bendButton,
        event: "click",
        handler: () => this.onBendClicked(),
      },
    ]);

    this._bendCallbacks.bind();
  }

  public unbind(): void {
    this._listeners.unbindAll();
    this._bendCallbacks.unbind();
  }
}
