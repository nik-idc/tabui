import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsComponent, PlayControlsTemplate } from "@/ui";

export interface PlayControlsCallbacks {
  onFirstClicked(): void;
  onPrevClicked(): void;
  onPlayClicked(): void;
  onNextClicked(): void;
  onLastClicked(): void;
  onLoopClicked(): void;
  bind(): void;
}

export class PlayControlsDefaultCallbacks implements PlayControlsCallbacks {
  private _playComponent: PlayControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;

  constructor(
    playComponent: PlayControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void
  ) {
    this._playComponent = playComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
  }

  onFirstClicked(): void {
    throw new Error("Method not implemented");
  }
  onPrevClicked(): void {
    throw new Error("Method not implemented");
  }
  onPlayClicked(): void {
    this._notationComponent.tabController.startPlayer();
  }
  onNextClicked(): void {
    throw new Error("Method not implemented");
  }
  onLastClicked(): void {
    throw new Error("Method not implemented");
  }
  onLoopClicked(): void {
    this._notationComponent.tabController.setLooped();
  }

  bind(): void {
    this._playComponent.template.firstButton.addEventListener("click", () =>
      this.onFirstClicked()
    );
    this._playComponent.template.prevButton.addEventListener("click", () =>
      this.onPrevClicked()
    );
    this._playComponent.template.playButton.addEventListener("click", () =>
      this.onPlayClicked()
    );
    this._playComponent.template.nextButton.addEventListener("click", () =>
      this.onNextClicked()
    );
    this._playComponent.template.lastButton.addEventListener("click", () =>
      this.onLastClicked()
    );
    this._playComponent.template.loopButton.addEventListener("click", () =>
      this.onLoopClicked()
    );
  }
}
