import {
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  StringInstrumentTone,
} from "../../../../notation/model";
import { NotationComponent } from "../../../../notation/notation-component";
import { NewTrackControlsComponent } from "./new-track-controls-component";
import { ListenerConfig, ListenerManager } from "../../../../shared/misc";
export interface NewTrackControlsCallbacks {
  readonly trackNameErrorText: string;
  readonly tuningErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onFamilyClicked(family: InstrumentFamily): void;
  onTypeClicked(type: InstrumentType): void;
  onToneClicked(tone: StringInstrumentTone): void;
  onTrackNameChanged(): void;
  onStringCountStep(delta: number): void;
  onTuningStringStep(stringIndex: number, semitones: number): void;
  onWholeTuningStep(semitones: number): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class NewTrackControlsDefaultCallbacks implements NewTrackControlsCallbacks {
  private _newTrackComponent: NewTrackControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _listeners = new ListenerManager();

  readonly trackNameErrorText: string = "Invalid track name";
  readonly tuningErrorText: string = "Invalid tuning";

  private _minTrackNameLength = 1;
  private _maxTrackNameLength = 32;

  constructor(
    newTrackComponent: NewTrackControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._newTrackComponent = newTrackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  onDialogClicked(event: MouseEvent): void {
    const target = event.target;
    if (
      !(typeof Node !== "undefined" && target instanceof Node) ||
      !this._newTrackComponent.template.dialogContent.contains(target)
    ) {
      this._newTrackComponent.template.dialog.close();
    }
  }

  onFamilyClicked(family: InstrumentFamily): void {
    this._newTrackComponent.setFamily(family);
    this._renderFunc();
  }

  onTypeClicked(type: InstrumentType): void {
    this._newTrackComponent.setType(type);
    this._renderFunc();
  }

  onToneClicked(tone: StringInstrumentTone): void {
    this._newTrackComponent.setTone(tone);
    this._renderFunc();
  }

  onTrackNameChanged(): void {
    const trackNameInput = this._newTrackComponent.template.trackNameInput;
    const trackNameError = this._newTrackComponent.template.trackNameError;
    const confirmButton = this._newTrackComponent.template.confirmButton;

    const trackName = trackNameInput.value.trim();
    if (
      trackName.length < this._minTrackNameLength ||
      trackName.length > this._maxTrackNameLength
    ) {
      trackNameError.textContent = this.trackNameErrorText;
      confirmButton.disabled = true;
    } else {
      trackNameError.textContent = " ";
      confirmButton.disabled = false;
      this._newTrackComponent.setTrackName(trackName);
    }
  }

  onStringCountStep(delta: number): void {
    this._newTrackComponent.shiftStringCount(delta);
  }

  onTuningStringStep(stringIndex: number, semitones: number): void {
    this._newTrackComponent.shiftTuningString(stringIndex, semitones);
  }

  onWholeTuningStep(semitones: number): void {
    this._newTrackComponent.shiftWholeTuning(semitones);
  }

  onConfirmClicked(): void {
    const controller = this._notationComponent.trackController;
    if (controller.isPlaybackActive) {
      this._newTrackComponent.template.dialog.close();
      return;
    }
    this.onTrackNameChanged();
    if (this._newTrackComponent.template.confirmButton.disabled) {
      return;
    }
    const track = this._notationComponent.trackController.addTrack(
      this._notationComponent.score,
      this._newTrackComponent.makeInstrument(),
      this._newTrackComponent.trackName
    );
    if (track === undefined) {
      this._newTrackComponent.template.dialog.close();
      return;
    }
    this._notationComponent.loadTrack(track);
    this._renderFunc();

    this._newTrackComponent.template.dialog.close();
  }

  onCancelClicked(): void {
    this._newTrackComponent.template.dialog.close();
  }

  onKeydown(event: KeyboardEvent): void {
    const template = this._newTrackComponent.template;
    const canConfirm =
      event.target === template.dialog ||
      event.target === template.trackNameInput ||
      event.target === template.confirmButton;
    if (
      event.key === "Enter" &&
      canConfirm &&
      !template.confirmButton.disabled
    ) {
      event.preventDefault();
      this.onConfirmClicked();
    }
  }

  bind(): void {
    const configs: ListenerConfig[] = [];

    configs.push({
      element: this._newTrackComponent.template.dialog as HTMLElement,
      event: "click",
      handler: (event: MouseEvent) => this.onDialogClicked(event),
    });
    configs.push(
      {
        element: this._newTrackComponent.template.dialog as HTMLElement,
        event: "close",
        handler: () => this._freeKeyboard(),
      },
      {
        element: this._newTrackComponent.template.dialog as HTMLElement,
        event: "keydown",
        handler: (event: KeyboardEvent) => this.onKeydown(event),
      }
    );

    const families = Object.values(InstrumentFamily);
    const familiesButtons =
      this._newTrackComponent.template.instrFamiliesButtons;
    for (let i = 0; i < families.length; i++) {
      configs.push({
        element: familiesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onFamilyClicked(families[i]),
      });
    }

    const types = INSTRUMENT_TYPES[this._newTrackComponent.instrumentFamily];
    const typesButtons = this._newTrackComponent.template.instrTypesButtons;
    for (let i = 0; i < types.length; i++) {
      configs.push({
        element: typesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onTypeClicked(types[i]),
      });
    }

    const tones =
      INSTRUMENT_TONES[this._newTrackComponent.instrumentType] ?? [];
    const tonesButtons = this._newTrackComponent.template.instrTonesButtons;
    for (let i = 0; i < tones.length; i++) {
      configs.push({
        element: tonesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onToneClicked(tones[i]),
      });
    }

    configs.push(
      {
        element: this._newTrackComponent.template.trackNameInput as HTMLElement,
        event: "input",
        handler: (event: Event) => this.onTrackNameChanged(),
      },
      {
        element: this._newTrackComponent.template
          .stringCountDownButton as HTMLElement,
        event: "click",
        handler: () => this.onStringCountStep(-1),
      },
      {
        element: this._newTrackComponent.template
          .stringCountUpButton as HTMLElement,
        event: "click",
        handler: () => this.onStringCountStep(1),
      },
      {
        element: this._newTrackComponent.template
          .wholeTuningDownButton as HTMLElement,
        event: "click",
        handler: () => this.onWholeTuningStep(-1),
      },
      {
        element: this._newTrackComponent.template
          .wholeTuningUpButton as HTMLElement,
        event: "click",
        handler: () => this.onWholeTuningStep(1),
      },
      {
        element: this._newTrackComponent.template.confirmButton as HTMLElement,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._newTrackComponent.template.cancelButton as HTMLElement,
        event: "click",
        handler: () => this.onCancelClicked(),
      }
    );

    const upButtons = this._newTrackComponent.template.tuningUpButtons;
    const downButtons = this._newTrackComponent.template.tuningDownButtons;
    for (let i = 0; i < upButtons.length; i++) {
      configs.push(
        {
          element: upButtons[i] as HTMLElement,
          event: "click",
          handler: () => this.onTuningStringStep(i, 1),
        },
        {
          element: downButtons[i] as HTMLElement,
          event: "click",
          handler: () => this.onTuningStringStep(i, -1),
        }
      );
    }

    this._listeners.bindAll(configs);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
