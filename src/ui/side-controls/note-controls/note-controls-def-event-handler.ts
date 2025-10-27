import { NoteDuration } from "@/notation";

import { NoteControlsEventHandler } from "./note-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export class NoteControlsDefaultEventHandler
  implements NoteControlsEventHandler
{
  onDurationClicked(
    noteDuration: NoteDuration,
    notationView: NotationView
  ): void {
    notationView.tabController.changeSelectedBeatDuration(noteDuration);
    notationView.renderAndBind();
  }
  onDotClicked(dots: number, notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onTupletNormalClicked(normalCount: number, notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
  onTupletClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
}
