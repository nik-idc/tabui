import { NotationComponent } from "@/notation/notation-component";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";
import { createButton, createImage } from "@/shared";
import { INSTRUMENT_KINDS } from "./track-settings-controls-component";

export class TrackSettingsControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TrackSettingsControlsTemplate;
  readonly assetsPath: string;

  private _currentTrackName: string = "Edit track";
  private _currentStringCount: number = 6;
  private _currentTuning: string = "E A D G B E";

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TrackSettingsControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-ts-dialog";
    const dialogContentCSSClass = "tu-ts-content";
    const trackInfoCSSClass = "tu-ts-track-info-container";
    const actionsCSSClass = "tu-ts-actions-container";

    this.template.dialog.classList.add(dialogCSSClass);
    this.template.dialogContent.classList.add(dialogContentCSSClass);
    this.template.trackInfoContainer.classList.add(trackInfoCSSClass);
    this.template.actionsContainer.classList.add(actionsCSSClass);

    this.template.dialog.appendChild(this.template.dialogContent);
    this.template.dialogContent.append(
      this.template.trackInfoContainer,
      this.template.actionsContainer
    );
    this.template.trackInfoContainer.append(
      this.template.trackNameInput,
      this.template.trackNameError,
      this.template.stringCountInput,
      this.template.stringCountError,
      this.template.tuningInput,
      this.template.tuningError
    );
    this.template.actionsContainer.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.parentDiv.appendChild(this.template.dialog);
  }

  private renderInputs(): void {
    const newTrackInputCSSClass = "tu-ts-input";
    const newTrackErrorCSSClass = "tu-ts-error";

    this.template.trackNameInput.classList.add(newTrackInputCSSClass);
    this.template.trackNameInput.value = this._currentTrackName;
    this.template.trackNameError.classList.add(newTrackErrorCSSClass);

    this.template.stringCountInput.classList.add(newTrackInputCSSClass);
    this.template.stringCountInput.type = "number";
    this.template.stringCountInput.value = `${this._currentStringCount}`;
    this.template.stringCountError.classList.add(newTrackErrorCSSClass);

    this.template.tuningInput.classList.add(newTrackInputCSSClass);
    this.template.tuningInput.value = this._currentTuning;
    this.template.tuningError.classList.add(newTrackErrorCSSClass);
  }

  private renderActionButtons(): void {
    const confirmCSSClass = "tu-ts-confirm-button";
    const cancelCSSClass = "tu-ts-cancel-button";

    this.template.confirmButton.classList.add(confirmCSSClass);
    this.template.confirmButton.textContent = "Confirm";
    this.template.cancelButton.classList.add(cancelCSSClass);
    this.template.cancelButton.textContent = "Cancel";
  }

  public render(
    currentTrackName: string,
    currentStringCount: number,
    currentTuning: string
  ): void {
    this._currentTrackName = currentTrackName;
    this._currentStringCount = currentStringCount;
    this._currentTuning = currentTuning;

    this.renderInputs();
    this.renderActionButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
