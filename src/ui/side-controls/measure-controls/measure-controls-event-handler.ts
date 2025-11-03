import { NotationComponent } from "@/notation/notation-component";
import { TimeSigControlsComponent } from "../effect-controls/time-sig-controls";
import { TempoControlsComponent } from "../effect-controls/tempo-controls";

export interface MeasureControlsEventHandler {
  onTempoClicked(
    notationComponent: NotationComponent,
    tempoControlsComponent: TempoControlsComponent
  ): void;
  onTimeSignatureClicked(
    notationComponent: NotationComponent,
    timeSigComponent: TimeSigControlsComponent
  ): void;
  onRepeatStartClicked(notationComponent: NotationComponent): void;
  onRepeatEndClicked(notationComponent: NotationComponent): void;
}

export class MeasureControlsDefaultEventHandler
  implements MeasureControlsEventHandler
{
  onTempoClicked(
    notationComponent: NotationComponent,
    tempoControlsComponent: TempoControlsComponent
  ): void {
    tempoControlsComponent.template.tempoDialog.showModal();
  }
  onTimeSignatureClicked(
    notationComponent: NotationComponent,
    timeSigComponent: TimeSigControlsComponent
  ): void {
    timeSigComponent.template.timeSigDialog.showModal();
  }
  onRepeatStartClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setSelectedBarRepeatStart();
    notationComponent.renderAndBind();
  }
  onRepeatEndClicked(notationComponent: NotationComponent): void {
    notationComponent.tabController.setSelectedBarRepeatEnd();
    notationComponent.renderAndBind();
  }
}
