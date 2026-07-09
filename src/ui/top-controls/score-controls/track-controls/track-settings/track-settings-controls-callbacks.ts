import {
  InstrumentFamily,
  InstrumentType,
  INSTRUMENT_TYPES,
  INSTRUMENT_TONES,
  isValidGuitarTuning,
  StringInstrumentTone,
  TrackInstrumentChangeMode,
} from "@/notation/model";
import { NotationComponent } from "@/notation/notation-component";
import { ListenerConfig, ListenerManager } from "@/shared/misc";
import { TrackSettingsControlsComponent } from "@/ui/top-controls/score-controls/track-controls/track-settings";

export interface TrackSettingsControlsCallbacks {
  readonly stringCountErrorText: string;
  readonly trackNameErrorText: string;
  readonly tuningErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onFamilyClicked(family: InstrumentFamily): void;
  onTypeClicked(type: InstrumentType): void;
  onToneClicked(tone: StringInstrumentTone): void;
  onTrackNameChanged(): void;
  onStringCountChanged(): void;
  onTuningChange(): void;
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

  readonly stringCountErrorText: string = "Invalid string count";
  readonly trackNameErrorText: string = "Invalid track name";
  readonly tuningErrorText: string = "Invalid tuning";

  private _minStringCount = 1;
  private _maxStringCount = 12;
  private _minTrackNameLength = 1;
  private _maxTrackNameLength = 32;

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

  private stringCountValid(stringCountValue: string): boolean {
    const stringCountNum = Number(stringCountValue);
    if (
      Number.isNaN(stringCountNum) ||
      stringCountNum < this._minStringCount ||
      stringCountNum > this._maxStringCount
    ) {
      return false;
    }

    return true;
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

  onTrackNameChanged(): void {
    const trackNameInput = this._trackSettingsComponent.template.trackNameInput;
    const trackNameError = this._trackSettingsComponent.template.trackNameError;
    const confirmButton = this._trackSettingsComponent.template.confirmButton;

    if (
      trackNameInput.value.length < this._minTrackNameLength ||
      trackNameInput.value.length > this._maxTrackNameLength
    ) {
      trackNameError.textContent = this.trackNameErrorText;
      confirmButton.disabled = true;
    } else {
      trackNameError.textContent = " ";
      confirmButton.disabled = false;
      this._trackSettingsComponent.setTrackName(trackNameInput.value);
    }
  }

  onStringCountChanged(): void {
    const stringCountInput =
      this._trackSettingsComponent.template.stringCountInput;
    const stringCountError =
      this._trackSettingsComponent.template.stringCountError;
    const confirmButton = this._trackSettingsComponent.template.confirmButton;

    if (!this.stringCountValid(stringCountInput.value)) {
      stringCountError.textContent = this.stringCountErrorText;
      confirmButton.disabled = true;
    } else {
      stringCountError.textContent = " ";
      confirmButton.disabled = false;
      this._trackSettingsComponent.setStringCount(
        Number(stringCountInput.value)
      );
    }
  }

  onTuningChange(): void {
    const tuningInput = this._trackSettingsComponent.template.tuningInput;
    const tuningError = this._trackSettingsComponent.template.tuningError;
    const confirmButton = this._trackSettingsComponent.template.confirmButton;

    const validTuning = isValidGuitarTuning(
      tuningInput.value,
      this._trackSettingsComponent.stringCount
    );
    if (!validTuning) {
      tuningError.textContent = this.tuningErrorText;
      confirmButton.disabled = true;
    } else {
      tuningError.textContent = " ";
      confirmButton.disabled = false;
      this._trackSettingsComponent.setTuning(tuningInput.value);
      this._trackSettingsComponent.render();
    }
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
          .trackNameInput as HTMLElement,
        event: "input",
        handler: (event: Event) => this.onTrackNameChanged(),
      },
      {
        element: this._trackSettingsComponent.template
          .stringCountInput as HTMLElement,
        event: "input",
        handler: (event: Event) => this.onStringCountChanged(),
      },
      {
        element: this._trackSettingsComponent.template
          .tuningInput as HTMLElement,
        event: "input",
        handler: (event: Event) => this.onTuningChange(),
      },
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

    this._listeners.bindAll(configs);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
