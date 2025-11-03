import { NotationComponent } from "@/notation/notation-component";
import { TimeSigControlsComponent } from "../effect-controls/time-sig-controls";

export interface MeasureControlsEventHandler {
  onTempoClicked(notationComponent: NotationComponent): void;
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
  onTempoClicked(notationComponent: NotationComponent): void {
    throw new Error("Method not implemented.");
  }
  onTimeSignatureClicked(
    notationComponent: NotationComponent,
    timeSigComponent: TimeSigControlsComponent
  ): void {
    // throw new Error("Method not implemented.");
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
