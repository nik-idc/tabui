import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsComponent, MeasureControlsTemplate } from "@/ui";
import {
  TempoControlsComponent,
  TempoControlsTemplate,
} from "@/ui/side-controls/measure-controls/tempo-controls";
import {
  TimeSigControlsComponent,
  TimeSigControlsTemplate,
} from "@/ui/side-controls/measure-controls/time-sig-controls";
import {
  TempoControlsCallbacks,
  TempoControlsDefaultCallbacks,
} from "./tempo-controls-callbacks";
import {
  TimeSigControlsCallbacks,
  TimeSigControlsDefaultCallbacks,
} from "./time-sig-controls-callbacks";
import { ListenerManager } from "@/shared/misc";
import { BarRepeatStatus } from "@/notation/model";

export interface MeasureControlsCallbacks {
  onTempoClicked(): void;
  onTimeSignatureClicked(): void;
  onRepeatStartClicked(): void;
  onRepeatEndClicked(): void;
  bind(): void;
  unbind(): void;
}

export class MeasureControlsDefaultCallbacks implements MeasureControlsCallbacks {
  private _measureComponent: MeasureControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  private _tempoCallbacks: TempoControlsCallbacks;
  private _timeSigCallbacks: TimeSigControlsCallbacks;

  constructor(
    measureComponent: MeasureControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._measureComponent = measureComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._tempoCallbacks = new TempoControlsDefaultCallbacks(
      this._measureComponent.tempoControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
    this._timeSigCallbacks = new TimeSigControlsDefaultCallbacks(
      this._measureComponent.timeSigControlsComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
  }

  onTempoClicked(): void {
    this._captureKeyboard();
    this._measureComponent.showTempoControls();
  }

  onTimeSignatureClicked(): void {
    this._captureKeyboard();
    this._measureComponent.showTimeSigControls();
  }

  onRepeatStartClicked(): void {
    this._notationComponent.trackController.trackControllerEditor.setSelectedBarRepeatStatus(
      BarRepeatStatus.Start
    );
    this._renderFunc();
  }

  onRepeatEndClicked(): void {
    this._notationComponent.trackController.trackControllerEditor.setSelectedBarRepeatStatus(
      BarRepeatStatus.End
    );
    this._renderFunc();
  }

  public bind(): void {
    this._listeners.bindAll([
      {
        element: this._measureComponent.template.tempoButton,
        event: "click",
        handler: () => this.onTempoClicked(),
      },
      {
        element: this._measureComponent.template.timeSignatureButton,
        event: "click",
        handler: () => this.onTimeSignatureClicked(),
      },
      {
        element: this._measureComponent.template.repeatStartButton,
        event: "click",
        handler: () => this.onRepeatStartClicked(),
      },
      {
        element: this._measureComponent.template.repeatEndButton,
        event: "click",
        handler: () => this.onRepeatEndClicked(),
      },
    ]);

    this._tempoCallbacks.bind();
    this._timeSigCallbacks.bind();
  }

  public unbind(): void {
    this._listeners.unbindAll();
    this._tempoCallbacks.unbind();
    this._timeSigCallbacks.unbind();
  }
}
