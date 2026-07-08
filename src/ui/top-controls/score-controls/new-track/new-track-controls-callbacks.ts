import { isValidGuitarTuning } from "@/notation/model";
import { NotationComponent } from "@/notation/notation-component";
import {
  INSTRUMENT_KINDS,
  NewTrackControlsComponent,
} from "@/ui/top-controls/score-controls/new-track/new-track-controls-component";
import { ListenerConfig, ListenerManager } from "@/shared/misc";
export interface NewTrackControlsCallbacks {
  readonly stringCountErrorText: string;
  readonly trackNameErrorText: string;
  readonly tuningErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onKindClicked(kind: string): void;
  onTypeClicked(type: string): void;
  onPresetClicked(preset: string): void;
  onTrackNameChanged(): void;
  onStringCountChanged(): void;
  onTuningChange(): void;
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

  readonly stringCountErrorText: string = "Invalid string count";
  readonly trackNameErrorText: string = "Invalid track name";
  readonly tuningErrorText: string = "Invalid tuning";

  private _minStringCount = 1;
  private _maxStringCount = 12;
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
      !this._newTrackComponent.template.dialogContent.contains(
        event.target as Node
      )
    ) {
      this._newTrackComponent.template.dialog.close();
      this._freeKeyboard();
    }
  }

  onKindClicked(kind: string): void {
    this._newTrackComponent.setKind(kind);
    this._renderFunc();
  }

  onTypeClicked(type: string): void {
    this._newTrackComponent.setType(type);
    this._renderFunc();
  }

  onPresetClicked(preset: string): void {
    this._newTrackComponent.setPreset(preset);
    this._renderFunc();
  }

  onTrackNameChanged(): void {
    const trackNameInput = this._newTrackComponent.template.trackNameInput;
    const trackNameError = this._newTrackComponent.template.trackNameError;
    const confirmButton = this._newTrackComponent.template.confirmButton;

    if (
      trackNameInput.value.length < this._minTrackNameLength ||
      trackNameInput.value.length > this._maxTrackNameLength
    ) {
      trackNameError.textContent = this.trackNameErrorText;
      confirmButton.disabled = true;
    } else {
      trackNameError.textContent = " ";
      confirmButton.disabled = false;
      this._newTrackComponent.setTrackName(trackNameInput.value);
    }
  }

  onStringCountChanged(): void {
    const stringCountInput = this._newTrackComponent.template.stringCountInput;
    const stringCountError = this._newTrackComponent.template.stringCountError;
    const confirmButton = this._newTrackComponent.template.confirmButton;

    if (!this.stringCountValid(stringCountInput.value)) {
      stringCountError.textContent = this.stringCountErrorText;
      confirmButton.disabled = true;
    } else {
      stringCountError.textContent = " ";
      confirmButton.disabled = false;
      this._newTrackComponent.setStringCount(Number(stringCountInput.value));
    }
  }

  onTuningChange(): void {
    const tuningInput = this._newTrackComponent.template.tuningInput;
    const tuningError = this._newTrackComponent.template.tuningError;
    const confirmButton = this._newTrackComponent.template.confirmButton;

    const validTuning = isValidGuitarTuning(
      tuningInput.value,
      this._newTrackComponent.stringCount
    );
    if (!validTuning) {
      tuningError.textContent = this.tuningErrorText;
      confirmButton.disabled = true;
    } else {
      tuningError.textContent = " ";
      confirmButton.disabled = false;
      this._newTrackComponent.setTuning(tuningInput.value);
    }
  }

  onConfirmClicked(): void {
    this._notationComponent.loadTrack(this._newTrackComponent.makeTrack());
    this._renderFunc();

    this._newTrackComponent.template.dialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._newTrackComponent.template.dialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    const configs: ListenerConfig[] = [];

    configs.push({
      element: this._newTrackComponent.template.dialog as HTMLElement,
      event: "click",
      handler: (event: Event) => this.onDialogClicked(event as MouseEvent),
    });

    const kinds = this._newTrackComponent.getAllKinds();
    const kindsButtons = this._newTrackComponent.template.instrKindsButtons;
    for (let i = 0; i < kinds.length; i++) {
      configs.push({
        element: kindsButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onKindClicked(kinds[i]),
      });
    }

    const types = this._newTrackComponent.getAllTypes();
    const typesButtons = this._newTrackComponent.template.instrTypesButtons;
    for (let i = 0; i < types.length; i++) {
      configs.push({
        element: typesButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onTypeClicked(types[i]),
      });
    }

    const presets = this._newTrackComponent.getAllPresets();
    const presetsButtons = this._newTrackComponent.template.instrPresetsButtons;
    for (let i = 0; i < presets.length; i++) {
      configs.push({
        element: presetsButtons[i] as HTMLElement,
        event: "click",
        handler: () => this.onPresetClicked(presets[i]),
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
          .stringCountInput as HTMLElement,
        event: "input",
        handler: (event: Event) => this.onStringCountChanged(),
      },
      {
        element: this._newTrackComponent.template.tuningInput as HTMLElement,
        event: "input",
        handler: (event: Event) => this.onTuningChange(),
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

    this._listeners.bindAll(configs);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
