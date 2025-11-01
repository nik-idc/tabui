import { NoteDuration, TabController } from "@/notation";

import { NotationView } from "@/notation/notation-view";
import { createOption } from "@/shared";
import { PlayControlsEventHandler } from "./play-controls-event-handler";
import { PlayControlsTemplate } from "./play-controls-template";

export class PlayControlsDefaultEventHandler
  implements PlayControlsEventHandler
{
  onFirstClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onPrevClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onPlayClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void {
    notationView.tabController.startPlayer();
  }
  onNextClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onLastClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onLoopClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void {
    notationView.tabController.setLooped();
  }
}
