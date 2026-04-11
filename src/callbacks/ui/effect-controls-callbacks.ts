import { NotationComponent } from "@/notation/notation-component";
import { GuitarTechniqueType } from "@/notation/model";
import { TechniqueControlsComponent } from "@/ui";
import {
  BendControlsCallbacks,
  BendControlsDefaultCallbacks,
} from "./bend-controls-callbacks";
import { ListenerManager } from "@/shared/misc";

export interface TechniqueControlsCallbacks {
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

export class TechniqueControlsDefaultCallbacks implements TechniqueControlsCallbacks {
  private _techniquesComponent: TechniqueControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  private _bendCallbacks: BendControlsCallbacks;

  constructor(
    techniquesComponent: TechniqueControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._techniquesComponent = techniquesComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._bendCallbacks = new BendControlsDefaultCallbacks(
      this._techniquesComponent.bendControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
  }

  public onVibratoClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Vibrato
    );
    this._renderFunc();
  }

  public onPalmMuteClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.PalmMute
    );
    this._renderFunc();
  }

  public onNHClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.NaturalHarmonic
    );
    this._renderFunc();
  }

  public onPHClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.PinchHarmonic
    );
    this._renderFunc();
  }

  public onHammerOnClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.HammerOnOrPullOff
    );
    this._renderFunc();
  }

  public onPullOffClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.HammerOnOrPullOff
    );
    this._renderFunc();
  }

  public onSlideClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Slide
    );
    this._renderFunc();
  }

  public onBendClicked(): void {
    this._techniquesComponent.showBendControls();
  }

  public bind(): void {
    this._listeners.bindAll([
      {
        element: this._techniquesComponent.template.vibratoButton,
        event: "click",
        handler: () => this.onVibratoClicked(),
      },
      {
        element: this._techniquesComponent.template.palmMuteButton,
        event: "click",
        handler: () => this.onPalmMuteClicked(),
      },
      {
        element: this._techniquesComponent.template.nhButton,
        event: "click",
        handler: () => this.onNHClicked(),
      },
      {
        element: this._techniquesComponent.template.phButton,
        event: "click",
        handler: () => this.onPHClicked(),
      },
      {
        element: this._techniquesComponent.template.hammerOnButton,
        event: "click",
        handler: () => this.onHammerOnClicked(),
      },
      {
        element: this._techniquesComponent.template.pullOffButton,
        event: "click",
        handler: () => this.onPullOffClicked(),
      },
      {
        element: this._techniquesComponent.template.slideButton,
        event: "click",
        handler: () => this.onSlideClicked(),
      },
      {
        element: this._techniquesComponent.template.bendButton,
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
