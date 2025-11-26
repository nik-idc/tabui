import { isValidGuitarTuning } from "@/notation";
import { NotationComponent } from "@/notation/notation-component";
import { ListenerConfig, ListenerManager } from "@/shared/misc";
import { TrackSettingsControlsComponent } from "@/ui/top-controls/score-controls/track-controls/track-settings";
export interface TrackSettingsControlsCallbacks {
  readonly stringCountErrorText: string;
  readonly trackNameErrorText: string;
  readonly tuningErrorText: string;

  onDialogClicked(event: MouseEvent): void;
  onTrackNameChanged(): void;
  onStringCountChanged(): void;
  onTuningChange(): void;
  onConfirmClicked(): void;
  onCancelClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TrackSettingsControlsDefaultCallbacks
  implements TrackSettingsControlsCallbacks
{
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
      trackNameError.textContent = this.stringCountErrorText;
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
      tuningError.textContent = this.stringCountErrorText;
      confirmButton.disabled = true;
    } else {
      tuningError.textContent = " ";
      confirmButton.disabled = false;
      this._trackSettingsComponent.setTrackName(tuningInput.value);
    }
  }

  onConfirmClicked(): void {
    this._trackSettingsComponent.track.name =
      this._trackSettingsComponent.trackName;
    // TODO: IMPLEMENT TRACK EDITING IN THE MODEL UPDATE!!
    this._renderFunc();

    this._trackSettingsComponent.template.dialog.close();
    this._freeKeyboard();
  }

  onCancelClicked(): void {
    this._trackSettingsComponent.template.dialog.close();
    this._freeKeyboard();
  }

  bind(): void {
    this._listeners.bindAll([
      {
        element: this._trackSettingsComponent.template.dialog as HTMLElement,
        event: "click",
        handler: (event: MouseEvent) => this.onDialogClicked(event),
      },
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
          .confirmButton as HTMLElement,
        event: "click",
        handler: () => this.onConfirmClicked(),
      },
      {
        element: this._trackSettingsComponent.template
          .cancelButton as HTMLElement,
        event: "click",
        handler: () => this.onCancelClicked(),
      },
    ]);
  }

  unbind(): void {
    this._listeners.unbindAll();
  }
}
