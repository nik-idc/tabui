import { NotationComponent } from "@/notation/notation-component";
import { TimeSigControlsTemplate } from "./time-sig-controls-template";

export class TimeSigControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TimeSigControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TimeSigControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-time-sig-dialog";
    this.template.timeSigDialog.classList.add(dialogCSSClass);
    const inputContainerCSSClass = "tu-time-sig-inputs";
    this.template.timeSigInputContent.classList.add(inputContainerCSSClass);
    const actionsCSSClass = "tu-time-sig-actions";
    this.template.timeSigActionsContent.classList.add(actionsCSSClass);

    this.template.timeSigDialog.append(
      this.template.timeSigInputContent,
      this.template.timeSigActionsContent
    );
    this.template.timeSigInputContent.append(
      this.template.textContainer,
      this.template.beatsInput,
      this.template.beatsErrorText,
      this.template.durationInput,
      this.template.durationErrorText
    );
    this.template.timeSigActionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.rootDiv.appendChild(this.template.timeSigDialog);
  }

  private renderTextContainer(): void {
    const cssClass = "tu-time-sig-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit time signature:";
  }

  private renderInputs(): void {
    const selectedElement =
      this.notationComponent.tabController.getSelectedBeat();

    let beatsInitValue: string;
    let durationInitValue: string;
    if (selectedElement !== undefined) {
      const selectedBar =
        this.notationComponent.tabController.tab.findBeatsBar(selectedElement);
      beatsInitValue = `${selectedBar.beatsCount}`;
      durationInitValue = `${selectedBar.duration}`;
    } else {
      beatsInitValue = "4";
      durationInitValue = "4";
    }

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
    const confirmCssClass = "tu-time-sig-confirm-button";
    this.template.confirmButton.classList.add(confirmCssClass);
    this.template.confirmButton.textContent = "Confirm";

    const cancelCssClass = "tu-time-sig-cancel-button";
    this.template.cancelButton.classList.add(cancelCssClass);
    this.template.cancelButton.textContent = "Cancel";
  }

  public render(): void {
    this.renderTextContainer();
    this.renderInputs();
    this.renderButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
