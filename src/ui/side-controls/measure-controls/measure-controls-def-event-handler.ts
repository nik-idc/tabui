import { NoteDuration } from "@/notation";
import { MeasureControlsEventHandler } from "./measure-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export class MeasureControlsDefaultEventHandler
  implements MeasureControlsEventHandler
{
  onTempoClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onTimeSignatureClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onRepeatStartClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onRepeatEndClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
}
