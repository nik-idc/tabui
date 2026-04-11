import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "@/ui/shared";
import { TrackSettingsControlsTemplate } from "./track-settings-controls-template";

export class TrackSettingsControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TrackSettingsControlsTemplate;

  private _currentTrackName: string = "Edit track";
  private _currentStringCount: number = 6;
  private _currentTuning: string = "E A D G B E";

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TrackSettingsControlsTemplate
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;

    this._assembled = false;
  }

  private assembleContainer(): void {
    assembleDialog(
      this.parentDiv,
      this.template.dialog,
      "tu-ts-dialog",
      this.template.dialogContent,
      "tu-ts-content",
      [
        {
          element: this.template.trackInfoContainer,
          className: "tu-ts-track-info-container",
          children: [
            this.template.trackNameInput,
            this.template.trackNameError,
            this.template.stringCountInput,
            this.template.stringCountError,
            this.template.tuningInput,
            this.template.tuningError,
          ],
        },
        {
          element: this.template.actionsContainer,
          className: "tu-ts-actions-container",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
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
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-ts-confirm-button",
      "tu-ts-cancel-button"
    );
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

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
