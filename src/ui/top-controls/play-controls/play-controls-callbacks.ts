import { NotationComponent } from "../../../notation/notation-component";
import { PlayControlsComponent } from "../..";
import { ListenerManager } from "../../../shared/misc";
import {
  MAX_PITCH_SHIFT_SEMITONES,
  MIN_PITCH_SHIFT_SEMITONES,
} from "../../../player/playback-constants";

export interface PlayControlsCallbacks {
  onFirstClicked(): void;
  onPrevClicked(): void;
  onPlayClicked(): void;
  onNextClicked(): void;
  onLastClicked(): void;
  onLoopClicked(): void;
  onRangeClicked(): void;
  onMetronomeClicked(): void;
  onPitchShiftChanged(delta: number): boolean;
  bind(): void;
  unbind(): void;
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
    this._notationComponent.trackController.selectFirstBar();
    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }
  onPrevClicked(): void {
    this._notationComponent.trackController.selectPreviousBar();
    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }
  onPlayClicked(): void {
    if (this._notationComponent.trackController.isPlaybackActive) {
      this._notationComponent.trackController.stopPlayer();
    } else {
      this._notationComponent.trackController.startPlayer();
    }

    this._renderFunc();
  }
  onNextClicked(): void {
    this._notationComponent.trackController.selectNextBar();
    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }
  onLastClicked(): void {
    this._notationComponent.trackController.selectLastBar();
    this._notationComponent.ensureSelectedNoteVisible();
    this._renderFunc();
  }
  onLoopClicked(): void {
    this._notationComponent.trackController.toggleLoop();
    this._renderFunc();
  }
  onRangeClicked(): void {
    const controller = this._notationComponent.trackController;
    if (controller.hasSelectionAnchor) {
      controller.clearSelectionRange();
    } else {
      controller.setSelectionAnchor();
    }
    this._renderFunc();
  }
  onMetronomeClicked(): void {
    const controller = this._notationComponent.trackController;
    controller.setMetronomeEnabled(!controller.metronomeEnabled);
    this._renderFunc();
  }
  onPitchShiftChanged(delta: number): boolean {
    const controller = this._notationComponent.trackController;
    const value = controller.pitchShiftSemitones + delta;
    if (
      value < MIN_PITCH_SHIFT_SEMITONES ||
      value > MAX_PITCH_SHIFT_SEMITONES
    ) {
      return false;
    }
    controller.setPitchShiftSemitones(value);
    this._renderFunc();
    return true;
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
      {
        element: this._playComponent.template.rangeButton,
        event: "click",
        handler: () => this.onRangeClicked(),
      },
      {
        element: this._playComponent.template.metronomeButton,
        event: "click",
        handler: () => this.onMetronomeClicked(),
      },
    ]);
    this._playComponent.template.pitchShiftControl.bind((delta) =>
      this.onPitchShiftChanged(delta)
    );
  }

  unbind(): void {
    this._listeners.unbindAll();
    this._playComponent.template.pitchShiftControl.unbind();
  }
}
