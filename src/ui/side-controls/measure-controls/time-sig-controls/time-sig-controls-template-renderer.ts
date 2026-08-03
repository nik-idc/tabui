import { NotationComponent } from "../../../../notation/notation-component";
import {
  MAX_MASTER_BAR_BEATS_COUNT,
  MIN_MASTER_BAR_BEATS_COUNT,
} from "../../../../notation/model";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import { TimeSigControlsTemplate } from "./time-sig-controls-template";
import { AVAILABLE_TIME_SIG_DURATIONS } from "./time-sig-controls-callbacks";

export class TimeSigControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TimeSigControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate
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
      "tu-time-sig-dialog",
      this.template.dialogContent,
      "tu-time-sig-dialog-content",
      [
        {
          element: this.template.inputContent,
          className: "tu-time-sig-inputs",
          children: [
            this.template.textContainer,
            this.template.beatsLabel,
            this.template.beatsControl,
            this.template.beatsErrorText,
            this.template.durationLabel,
            this.template.durationSelect,
            this.template.durationErrorText,
          ],
        },
        {
          element: this.template.actionsContent,
          className: "tu-time-sig-actions",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
    this.template.beatsControl.append(
      this.template.beatsDownButton,
      this.template.beatsValue,
      this.template.beatsUpButton
    );
  }

  private renderTextContainer(): void {
    const cssClass = "tu-time-sig-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit time signature:";
  }

  private renderInputs(): void {
    const selectedNote = this.notationComponent.trackController.selectedNote;

    const beatsInitValue =
      selectedNote !== undefined
        ? `${selectedNote.bar.masterBar.beatsCount}`
        : "4";
    const durationInitValue =
      selectedNote !== undefined
        ? `${1 / selectedNote.bar.masterBar.duration}`
        : "4";

    this.template.beatsLabel.textContent = "Beats per measure";
    this.template.beatsControl.classList.add("tu-number-stepper");
    this.template.beatsDownButton.textContent = "-";
    this.template.beatsValue.classList.add("tu-number-stepper-value");
    this.template.beatsValue.textContent = beatsInitValue;
    this.template.beatsUpButton.textContent = "+";
    this.template.beatsDownButton.disabled =
      Number(beatsInitValue) <= MIN_MASTER_BAR_BEATS_COUNT;
    this.template.beatsUpButton.disabled =
      Number(beatsInitValue) >= MAX_MASTER_BAR_BEATS_COUNT;
    const beatsErrorCSSClass = "tu-time-sig-beats-error";
    this.template.beatsErrorText.classList.add(beatsErrorCSSClass);

    const durationCSSClass = "tu-time-sig-duration-input";
    this.template.durationLabel.textContent = "Beat unit";
    this.template.durationSelect.classList.add(durationCSSClass);
    if (this.template.durationSelect.options.length === 0) {
      for (const duration of AVAILABLE_TIME_SIG_DURATIONS) {
        const option = document.createElement("option");
        option.value = `${duration}`;
        option.textContent = `${duration}`;
        this.template.durationSelect.appendChild(option);
      }
    }
    this.template.durationSelect.value = durationInitValue;
    const durationErrorCSSClass = "tu-time-sig-duration-error";
    this.template.durationErrorText.classList.add(durationErrorCSSClass);
  }

  private renderButtons(): void {
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-time-sig-confirm-button",
      "tu-time-sig-cancel-button"
    );
  }

  public render(): void {
    this.renderTextContainer();
    this.renderInputs();
    this.renderButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
