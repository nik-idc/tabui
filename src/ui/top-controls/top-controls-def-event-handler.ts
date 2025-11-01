import { NoteDuration, TabController } from "@/notation";

import { TopControlsEventHandler } from "./top-controls-event-handler";
import { NotationView } from "@/notation/notation-view";
import { TopControlsTemplate } from "./top-controls-template";
import { createOption } from "@/shared";

export class TopControlsDefaultEventHandler implements TopControlsEventHandler {
  private template: TopControlsTemplate | undefined;

  constructor(template?: TopControlsTemplate) {
    this.template = template;
  }

  onTrackChanged(trackValue: number, notationView: NotationView): void {
    const newTabController = new TabController(
      notationView.tabController.score,
      notationView.tabController.score.tracks[trackValue],
      notationView.tabController.dim
    );
    notationView.loadTrack(newTabController);
  }
  onNewTrackClicked(notationView: NotationView): void {
    // Add a new tab/track using the current tab's guitar and instrument name
    const score = notationView.tabController.score;
    const currentTab = notationView.tabController.tab;
    score.addTab(currentTab.guitar, "New tab", currentTab.instrumentName);

    // Load the newly added track
    const newIndex = score.tracks.length - 1;
    const newTabController = new TabController(
      score,
      score.tracks[newIndex],
      notationView.tabController.dim
    );
    notationView.loadTrack(newTabController);
    // Update track selector in UI if we have the template
    if (this.template !== undefined) {
      try {
        const opt = createOption();
        opt.text = score.tracks[newIndex].name;
        opt.value = `${newIndex}`;
        this.template.trackSelector.add(opt);
        this.template.trackSelector.value = `${newIndex}`;
      } catch (e) {
        // Ignore errors updating UI (e.g., server-side rendering or missing elements)
      }
    }
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
