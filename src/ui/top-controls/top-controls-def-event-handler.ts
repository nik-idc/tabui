import { NoteDuration, TabController } from "@/notation";

import { TopControlsEventHandler } from "./top-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export class TopControlsDefaultEventHandler implements TopControlsEventHandler {
  onTrackChanged(trackValue: number, notationView: NotationView): void {
    const newTabController = new TabController(
      notationView.tabController.score,
      notationView.tabController.score.tracks[trackValue],
      notationView.tabController.dim
    );
    notationView.loadTrack(newTabController);
  }
  onPlayClicked(notationView: NotationView): void {
    notationView.tabController.startPlayer();
  }
  onPauseClicked(notationView: NotationView): void {
    notationView.tabController.stopPlayer();
  }
  onStopClicked(notationView: NotationView): void {
    notationView.tabController.stopPlayer();
  }
  onLoopClicked(notationView: NotationView): void {
    notationView.tabController.setLooped();
  }
}
