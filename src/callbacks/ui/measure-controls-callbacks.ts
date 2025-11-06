import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsComponent, MeasureControlsTemplate } from "@/ui";
import {
  TempoControlsComponent,
  TempoControlsTemplate,
} from "@/ui/side-controls/effect-controls/tempo-controls";
import {
  TimeSigControlsComponent,
  TimeSigControlsTemplate,
} from "@/ui/side-controls/effect-controls/time-sig-controls";
import {
  TempoControlsCallbacks,
  TempoControlsDefaultCallbacks,
} from "./tempo-controls-callbacks";
import {
  TimeSigControlsCallbacks,
  TimeSigControlsDefaultCallbacks,
} from "./time-sig-controls-callbacks";

export interface MeasureControlsCallbacks {
  onTempoClicked(): void;
  onTimeSignatureClicked(): void;
  onRepeatStartClicked(): void;
  onRepeatEndClicked(): void;
  bind(): void;
}

export class MeasureControlsDefaultCallbacks
  implements MeasureControlsCallbacks
{
  private _measureComponent: MeasureControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  private _tempoCallbacks: TempoControlsCallbacks;
  private _timeSigCallbacks: TimeSigControlsCallbacks;

  constructor(
    measureComponent: MeasureControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._measureComponent = measureComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;

    this._tempoCallbacks = new TempoControlsDefaultCallbacks(
      this._measureComponent.tempoControlsComponent,
      this._notationComponent,
      this._renderFunc
    );
    this._timeSigCallbacks = new TimeSigControlsDefaultCallbacks(
      this._measureComponent.timeSigControlsComponent,
      this._notationComponent,
      this._renderFunc
    );
  }

  onTempoClicked(): void {
    this._measureComponent.tempoControlsComponent.template.tempoDialog.showModal();
  }
  onTimeSignatureClicked(): void {
    this._measureComponent.timeSigControlsComponent.template.timeSigDialog.showModal();
  }
  onRepeatStartClicked(): void {
    this._notationComponent.tabController.setSelectedBarRepeatStart();
    this._renderFunc();
  }
  onRepeatEndClicked(): void {
    this._notationComponent.tabController.setSelectedBarRepeatEnd();
    this._renderFunc();
  }

  public bind(): void {
    this._measureComponent.template.tempoButton.addEventListener("click", () =>
      this.onTempoClicked()
    );
    this._measureComponent.template.timeSignatureButton.addEventListener(
      "click",
      () => this.onTimeSignatureClicked()
    );
    this._measureComponent.template.repeatStartButton.addEventListener(
      "click",
      () => this.onRepeatStartClicked()
    );
    this._measureComponent.template.repeatEndButton.addEventListener(
      "click",
      () => this.onRepeatEndClicked()
    );

    this._tempoCallbacks.bind();
    this._timeSigCallbacks.bind();
  }
}
