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
    // notationView.tabController.changeSelectedBeatDuration(noteDuration);
    // notationView.tabController.changeSelectionDuration(noteDuration);
    notationView.tabController.changeDuration(noteDuration);
    notationView.renderAndBind();
  }

  onDotClicked(dots: number, notationView: NotationView): void {
    // notationView.tabController.setSelectedBeatDots(dots);
    notationView.tabController.setDots(dots);
    notationView.renderAndBind();
  }

  onTupletNormalClicked(normalCount: number, notationView: NotationView): void {
    if (normalCount < 2) {
      throw Error("Tuplet normal count has to be >= 2");
    }
    notationView.tabController.setSelectedBeatsTuplet(
      normalCount,
      normalCount - 1
    );
    notationView.renderAndBind();
  }

  onTupletClicked(notationView: NotationView): void {
    throw new Error("Method not implemented.");
  }
}
