import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "@/ui/shared";
import { TimeSigControlsTemplate } from "./time-sig-controls-template";

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
            this.template.beatsInput,
            this.template.beatsErrorText,
            this.template.durationInput,
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

    const beatsCSSClass = "tu-time-sig-beats-input";
    this.template.beatsInput.classList.add(beatsCSSClass);
    this.template.beatsInput.type = "number";
    this.template.beatsInput.value = beatsInitValue;
    const beatsErrorCSSClass = "tu-time-sig-beats-error";
    this.template.beatsErrorText.classList.add(beatsErrorCSSClass);

    const durationCSSClass = "tu-time-sig-duration-input";
    this.template.durationInput.classList.add(durationCSSClass);
    this.template.durationInput.type = "number";
    this.template.durationInput.value = durationInitValue;
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
