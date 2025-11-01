import { NotationView } from "@/notation/notation-view";
import { PlayControlsTemplate } from "./play-controls-template";

export interface PlayControlsEventHandler {
  onFirstClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void;
  onPrevClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void;
  onPlayClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void;
  onNextClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void;
  onLastClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void;
  onLoopClicked(
    notationView: NotationView,
    template: PlayControlsTemplate
  ): void;
}
