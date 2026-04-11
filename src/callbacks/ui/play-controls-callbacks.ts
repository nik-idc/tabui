import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsComponent } from "@/ui";
import { ListenerManager } from "@/shared/misc";

export interface PlayControlsCallbacks {
  onFirstClicked(): void;
  onPrevClicked(): void;
  onPlayClicked(): void;
  onNextClicked(): void;
  onLastClicked(): void;
  onLoopClicked(): void;
  bind(): void;
  unbind(): void;
}

export class PlayControlsDefaultCallbacks implements PlayControlsCallbacks {
  private _playComponent: PlayControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  constructor(
    playComponent: PlayControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._playComponent = playComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  onFirstClicked(): void {
    throw new Error("Method not implemented");
  }
  onPrevClicked(): void {
    throw new Error("Method not implemented");
  }
  onPlayClicked(): void {
    if (this._notationComponent.trackController.isPlaying) {
      this._notationComponent.trackController.stopPlayer();
    } else {
      this._notationComponent.trackController.startPlayer();
    }

    this._renderFunc();
  }
  onNextClicked(): void {
    throw new Error("Method not implemented");
  }
  onLastClicked(): void {
    throw new Error("Method not implemented");
  }
  onLoopClicked(): void {
    this._notationComponent.trackController.toggleLoop();
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
