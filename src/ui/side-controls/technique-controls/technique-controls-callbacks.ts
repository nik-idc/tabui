import { NotationComponent } from "../../../notation/notation-component";
import { GuitarTechniqueType } from "../../../notation/model";
import { TechniqueControlsComponent } from "../..";
import {
  BendControlsCallbacks,
  BendControlsDefaultCallbacks,
} from "./bend-controls/bend-controls-callbacks";
import { ListenerManager } from "../../../shared/misc";
import {
  StrokeControlsCallbacks,
  StrokeControlsDefaultCallbacks,
} from "./stroke-controls/stroke-controls-callbacks";

export interface TechniqueControlsCallbacks {
  onVibratoClicked(): void;
  onPalmMuteClicked(): void;
  onLetRingClicked(): void;
  onTieClicked(): void;
  onNHClicked(): void;
  onPHClicked(): void;
  onLegatoClicked(): void;
  onSlideClicked(): void;
  onBendClicked(): void;
  onStrokeClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TechniqueControlsDefaultCallbacks implements TechniqueControlsCallbacks {
  private _techniquesComponent: TechniqueControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _listeners = new ListenerManager();

  private _bendCallbacks: BendControlsCallbacks;
  private _strokeCallbacks: StrokeControlsCallbacks;

  constructor(
    techniquesComponent: TechniqueControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._techniquesComponent = techniquesComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._bendCallbacks = new BendControlsDefaultCallbacks(
      this._techniquesComponent.bendControlsComponent,
      this._notationComponent,
      this._renderFunc
    );
    this._strokeCallbacks = new StrokeControlsDefaultCallbacks(
      this._techniquesComponent.strokeControlsComponent,
      this._notationComponent,
      this._renderFunc
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

  public onLetRingClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.LetRing
    );
    this._renderFunc();
  }

  public onTieClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Tie
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

  public onLegatoClicked(): void {
    this._notationComponent.trackController.setTechnique(
      GuitarTechniqueType.Legato
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

  /** Opens stroke settings, like the Shift+D shortcut. */
  public onStrokeClicked(): void {
    this._techniquesComponent.showStrokeControls();
  }

  public bind(): void {
    this._listeners.bindAll([
      {
        element: this._techniquesComponent.template.tieButton,
        event: "click",
        handler: () => this.onTieClicked(),
      },
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
        element: this._techniquesComponent.template.letRingButton,
        event: "click",
        handler: () => this.onLetRingClicked(),
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
        element: this._techniquesComponent.template.legatoButton,
        event: "click",
        handler: () => this.onLegatoClicked(),
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
      {
        element: this._techniquesComponent.template.strokeButton,
        event: "click",
        handler: () => this.onStrokeClicked(),
      },
    ]);

    this._bendCallbacks.bind();
    this._strokeCallbacks.bind();
  }

  public unbind(): void {
    this._listeners.unbindAll();
    this._bendCallbacks.unbind();
    this._strokeCallbacks.unbind();
  }
}
