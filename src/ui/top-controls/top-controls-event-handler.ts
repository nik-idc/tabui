
import { NotationView } from "@/notation/notation-view";

export interface TopControlsEventHandler {
  onTrackChanged(trackValue: number, notationView: NotationView): void;
  onPlayClicked(notationView: NotationView): void;
  onPauseClicked(notationView: NotationView): void;
  onStopClicked(notationView: NotationView): void;
  onLoopClicked(notationView: NotationView): void;
}
