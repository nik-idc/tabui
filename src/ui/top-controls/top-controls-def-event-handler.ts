import { NoteDuration } from "@/notation";

import { TopControlsEventHandler } from "./top-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export class TopControlsDefaultEventHandler implements TopControlsEventHandler {
  onTrackChanged(trackValue: number, notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onPlayClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onPauseClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onStopClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onLoopClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
}
