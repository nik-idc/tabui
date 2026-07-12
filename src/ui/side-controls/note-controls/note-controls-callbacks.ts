import { NoteDuration, VoiceNumber } from "../../../notation/model";
import { NotationComponent } from "../../../notation/notation-component";
import { NoteControlsComponent } from "../..";
import { ListenerConfig, ListenerManager } from "../../../shared/misc";
import {
  TupletControlsCallbacks,
  TupletControlsDefaultCallbacks,
} from "./tuplet-controls/tuplet-controls-callbacks";

export interface NoteControlsCallbacks {
  onDurationClicked(noteDuration: NoteDuration): void;
  onDotClicked(dots: number): void;
  onInsertBeatBeforeClicked(): void;
  onInsertBeatAfterClicked(): void;
  onRemoveBeatClicked(): void;
  onRestClicked(): void;
  onVoiceClicked(voiceNumber: VoiceNumber): void;
  onTupletNormalClicked(normalCount: number): void;
  onTupletClicked(): void;
  bind(): void;
  unbind(): void;
}

export class NoteControlsDefaultCallbacks implements NoteControlsCallbacks {
  private _noteComponent: NoteControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _renderActiveVoiceFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;

  private _listeners = new ListenerManager();

  private _tupletCallbacks: TupletControlsCallbacks;

  constructor(
    noteComponent: NoteControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    renderActiveVoiceFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._noteComponent = noteComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._renderActiveVoiceFunc = renderActiveVoiceFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;

    this._tupletCallbacks = new TupletControlsDefaultCallbacks(
      this._noteComponent.tupletComponent,
      this._notationComponent,
      this._renderFunc,
      this._captureKeyboard,
      this._freeKeyboard
    );
  }

  onDurationClicked(noteDuration: NoteDuration): void {
    this._notationComponent.trackController.setDuration(noteDuration);
    this._renderFunc();
  }

  onDotClicked(dots: number): void {
    this._notationComponent.trackController.setDots(dots);
    this._renderFunc();
  }

  onInsertBeatBeforeClicked(): void {
    this._notationComponent.trackController.insertBeatBeforeSelected();
    this._renderFunc();
  }

  onInsertBeatAfterClicked(): void {
    this._notationComponent.trackController.insertBeatAfterSelected();
    this._renderFunc();
  }

  onRemoveBeatClicked(): void {
    this._notationComponent.trackController.removeSelectedBeat();
    this._renderFunc();
  }

  onRestClicked(): void {
    this._notationComponent.trackController.setSelectedBeatRest();
    this._renderFunc();
  }

  onVoiceClicked(voiceNumber: VoiceNumber): void {
    this._notationComponent.trackController.setActiveVoiceNumber(voiceNumber);
    this._renderActiveVoiceFunc();
  }

  onTupletNormalClicked(normalCount: number): void {
    if (normalCount < 2) {
      throw Error("Tuplet normal count has to be >= 2");
    }
    this._notationComponent.trackController.setSelectedBeatsTuplet(
      normalCount,
      normalCount - 1
    );
    this._renderFunc();
  }

  onTupletClicked(): void {
    this._captureKeyboard();
    this._noteComponent.showTupletControls();
  }

  bind(): void {
    // Bind duration buttons
    const durationConfigs = this._noteComponent.template.durationButtons.map(
      (button) =>
        ({
          element: button,
          event: "click",
          handler: () =>
            this.onDurationClicked(1 / Number(button.dataset["duration"])),
        }) as ListenerConfig
    );

    const voiceConfigs = this._noteComponent.template.voiceButtons.map(
      (button) =>
        ({
          element: button,
          event: "click",
          handler: () =>
            this.onVoiceClicked(
              Number(button.dataset["voiceNumber"]) as VoiceNumber
            ),
        }) as ListenerConfig
    );

    // Bind dot and tuplet buttons
    const otherConfigs: ListenerConfig[] = [
      {
        element: this._noteComponent.template.restButton,
        event: "click",
        handler: () => this.onRestClicked(),
      },
      {
        element: this._noteComponent.template.dot1Button,
        event: "click",
        handler: () => this.onDotClicked(1),
      },
      {
        element: this._noteComponent.template.dot2Button,
        event: "click",
        handler: () => this.onDotClicked(2),
      },
      {
        element: this._noteComponent.template.insertBeatBeforeButton,
        event: "click",
        handler: () => this.onInsertBeatBeforeClicked(),
      },
      {
        element: this._noteComponent.template.insertBeatAfterButton,
        event: "click",
        handler: () => this.onInsertBeatAfterClicked(),
      },
      {
        element: this._noteComponent.template.removeBeatButton,
        event: "click",
        handler: () => this.onRemoveBeatClicked(),
      },
      {
        element: this._noteComponent.template.tuplet2Button,
        event: "click",
        handler: () => this.onTupletNormalClicked(2),
      },
      {
        element: this._noteComponent.template.tuplet3Button,
        event: "click",
        handler: () => this.onTupletNormalClicked(3),
      },
      {
        element: this._noteComponent.template.tupletButton,
        event: "click",
        handler: () => this.onTupletClicked(),
      },
    ];

    this._listeners.bindAll([
      ...durationConfigs,
      ...voiceConfigs,
      ...otherConfigs,
    ]);

    this._tupletCallbacks.bind();
  }

  unbind(): void {
    this._listeners.unbindAll();
    this._tupletCallbacks.unbind();
  }
}
