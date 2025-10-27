
import { NotationView } from "@/notation/notation-view";

export interface MeasureControlsEventHandler {
  onTempoClicked(notationView: NotationView): void;
  onTimeSignatureClicked(notationView: NotationView): void;
  onRepeatStartClicked(notationView: NotationView): void;
  onRepeatEndClicked(notationView: NotationView): void;
}
