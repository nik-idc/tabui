import { TabController } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsComponent, PlayControlsTemplate } from "@/ui";
import { ListenerManager } from "@/shared/misc";

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
  private _listeners = new ListenerManager();

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
    this._listeners.bindAll([
      {
        element: this._playComponent.template.firstButton,
        event: "click",
        handler: () => this.onFirstClicked(),
      },
      {
        element: this._playComponent.template.prevButton,
        event: "click",
        handler: () => this.onPrevClicked(),
      },
      {
        element: this._playComponent.template.playButton,
        event: "click",
        handler: () => this.onPlayClicked(),
      },
      {
        element: this._playComponent.template.nextButton,
        event: "click",
        handler: () => this.onNextClicked(),
      },
      {
        element: this._playComponent.template.lastButton,
        event: "click",
        handler: () => this.onLastClicked(),
      },
      {
        element: this._playComponent.template.loopButton,
        event: "click",
        handler: () => this.onLoopClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
