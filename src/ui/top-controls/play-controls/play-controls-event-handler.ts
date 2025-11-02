import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsTemplate } from "./play-controls-template";

export interface PlayControlsEventHandler {
  onFirstClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void;
  onPrevClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void;
  onPlayClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void;
  onNextClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void;
  onLastClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void;
  onLoopClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void;
}

export class PlayControlsDefaultEventHandler
  implements PlayControlsEventHandler
{
  onFirstClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onPrevClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onPlayClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void {
    notationComponent.tabController.startPlayer();
  }
  onNextClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onLastClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void {
    throw new Error("Method not implemented");
  }
  onLoopClicked(
    notationComponent: NotationComponent,
    template: PlayControlsTemplate
  ): void {
    notationComponent.tabController.setLooped();
  }
}
