import {
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  StringInstrumentTone,
  TrackInstrumentChangeMode,
} from "@/notation/model";
import { NotationComponent } from "@/notation/notation-component";
import { ListenerConfig, ListenerManager } from "@/shared/misc";
import { TrackSettingsControlsComponent } from "@/ui/top-controls/score-controls/track-controls/track-settings";

export interface TrackSettingsControlsCallbacks {
  readonly tuningErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onFamilyClicked(family: InstrumentFamily): void;
  onTypeClicked(type: InstrumentType): void;
  onToneClicked(tone: StringInstrumentTone): void;
  onTuningStringStep(stringIndex: number, semitones: number): void;
  onWholeTuningStep(semitones: number): void;
  onTuningModeClicked(mode: TrackInstrumentChangeMode): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TrackSettingsControlsDefaultCallbacks implements TrackSettingsControlsCallbacks {
  private _trackSettingsComponent: TrackSettingsControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _captureKeyboard: () => void;
  private _freeKeyboard: () => void;
  private _listeners = new ListenerManager();

  readonly tuningErrorText: string = "Invalid tuning";

  constructor(
    newTrackComponent: TrackSettingsControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    captureKeyboard: () => void,
    freeKeyboard: () => void
  ) {
    this._trackSettingsComponent = newTrackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._captureKeyboard = captureKeyboard;
    this._freeKeyboard = freeKeyboard;
  }

  onFamilyClicked(family: InstrumentFamily): void {
    this._trackSettingsComponent.setFamily(family);
    this._renderFunc();
  }

  onTypeClicked(type: InstrumentType): void {
    this._trackSettingsComponent.setType(type);
    this._renderFunc();
  }

  onToneClicked(tone: StringInstrumentTone): void {
    this._trackSettingsComponent.setTone(tone);
    this._renderFunc();
  }

  onDialogClicked(event: MouseEvent): void {
    if (
      !this._trackSettingsComponent.template.dialogContent.contains(
        event.target as Node
      )
    ) {
      this._trackSettingsComponent.template.dialog.close();
      this._freeKeyboard();
    }
  }

  onTuningStringStep(stringIndex: number, semitones: number): void {
    this._trackSettingsComponent.shiftTuningString(stringIndex, semitones);
  }

  onWholeTuningStep(semitones: number): void {
    this._trackSettingsComponent.shiftWholeTuning(semitones);
  }

  onTuningModeClicked(mode: TrackInstrumentChangeMode): void {
    this._trackSettingsComponent.setTuningChangeMode(mode);
  }

  onConfirmClicked(): void {
    this._trackSettingsComponent.applyTrackSettings();
    if (
      this._notationComponent.trackController.track ===
      this._trackSettingsComponent.track
    ) {
      this._notationComponent.loadTrack(this._trackSettingsComponent.track);
    }
    this._renderFunc();

    this._trackSettingsComponent.template.dialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._trackSettingsComponent.template.dialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    const configs: ListenerConfig[] = [];

    configs.push({
      element: this._trackSettingsComponent.template.dialog as HTMLElement,
      event: "click",
      handler: (event: MouseEvent) => this.onDialogClicked(event),
    });

    const families = Object.values(InstrumentFamily);
    const familiesButtons =
      this._trackSettingsComponent.template.instrFamiliesButtons;
    for (let i = 0; i < families.length; i++) {
      configs.push({
        element: familiesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onFamilyClicked(families[i]),
      });
    }

    const family = this._trackSettingsComponent.instrumentFamily;
    const types = INSTRUMENT_TYPES[family];
    const typesButtons =
      this._trackSettingsComponent.template.instrTypesButtons;
    for (let i = 0; i < types.length; i++) {
      configs.push({
        element: typesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onTypeClicked(types[i]),
      });
    }

    const tones =
      INSTRUMENT_TONES[this._trackSettingsComponent.instrumentType] ?? [];
    const tonesButtons =
      this._trackSettingsComponent.template.instrTonesButtons;
    for (let i = 0; i < tones.length; i++) {
      configs.push({
        element: tonesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onToneClicked(tones[i]),
      });
    }

    configs.push(
      {
        element: this._trackSettingsComponent.template
          .keepFretsButton as HTMLElement,
        event: "click",
        handler: () => this.onTuningModeClicked("keepFrets"),
      },
      {
        element: this._trackSettingsComponent.template
          .transposeButton as HTMLElement,
        event: "click",
        handler: () => this.onTuningModeClicked("transpose"),
      },
      {
        element: this._trackSettingsComponent.template
          .wholeTuningDownButton as HTMLElement,
        event: "click",
        handler: () => this.onWholeTuningStep(-1),
      },
      {
        element: this._trackSettingsComponent.template
          .wholeTuningUpButton as HTMLElement,
        event: "click",
        handler: () => this.onWholeTuningStep(1),
      },
      {
        element: this._trackSettingsComponent.template
          .confirmButton as HTMLElement,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._trackSettingsComponent.template
          .cancelButton as HTMLElement,
        event: "click",
        handler: () => this.onCancelClicked(),
      }
    );

    const upButtons = this._trackSettingsComponent.template.tuningUpButtons;
    const downButtons = this._trackSettingsComponent.template.tuningDownButtons;
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
