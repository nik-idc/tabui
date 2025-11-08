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
}

export class EffectControlsDefaultCallbacks implements EffectControlsCallbacks {
  private _effectsComponent: EffectControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _bendCallbacks: BendControlsCallbacks;

  constructor(
    effectsComponent: EffectControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._effectsComponent = effectsComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._bendCallbacks = new BendControlsDefaultCallbacks(
      this._effectsComponent.bendControlsComponent,
      this._notationComponent,
      this._renderFunc
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
    this._effectsComponent.template.vibratoButton.addEventListener(
      "click",
      () => this.onVibratoClicked()
    );
    this._effectsComponent.template.palmMuteButton.addEventListener(
      "click",
      () => this.onPalmMuteClicked()
    );
    this._effectsComponent.template.nhButton.addEventListener("click", () =>
      this.onNHClicked()
    );
    this._effectsComponent.template.phButton.addEventListener("click", () =>
      this.onPHClicked()
    );
    this._effectsComponent.template.hammerOnButton.addEventListener(
      "click",
      () => this.onHammerOnClicked()
    );
    this._effectsComponent.template.pullOffButton.addEventListener(
      "click",
      () => this.onPullOffClicked()
    );
    this._effectsComponent.template.slideButton.addEventListener("click", () =>
      this.onSlideClicked()
    );
    this._effectsComponent.template.bendButton.addEventListener("click", () =>
      this.onBendClicked()
    );

    this._bendCallbacks.bind();
  }
}
