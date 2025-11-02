import { NotationComponent } from "@/notation/notation-component";

export interface MeasureControlsEventHandler {
  onTempoClicked(notationComponent: NotationComponent): void;
  onTimeSignatureClicked(notationComponent: NotationComponent): void;
  onRepeatStartClicked(notationComponent: NotationComponent): void;
  onRepeatEndClicked(notationComponent: NotationComponent): void;
}

export class MeasureControlsDefaultEventHandler
  implements MeasureControlsEventHandler
{
  onTempoClicked(notationComponent: NotationComponent): void {
    throw new Error("Method not implemented.");
  }
  onTimeSignatureClicked(notationComponent: NotationComponent): void {
    throw new Error("Method not implemented.");
  }
  onRepeatStartClicked(notationComponent: NotationComponent): void {
    // throw new Error("Method not implemented.");
    notationComponent.tabController.setSelectedBarRepeatStart();
    notationComponent.renderAndBind();
  }
  onRepeatEndClicked(notationComponent: NotationComponent): void {
    // throw new Error("Method not implemented.");
    notationComponent.tabController.setSelectedBarRepeatEnd();
    notationComponent.renderAndBind();
  }
}
