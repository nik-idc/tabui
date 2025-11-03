import { NotationComponent } from "@/notation/notation-component";
import { TempoControlsTemplate } from "./tempo-controls-template";

export class TempoControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TempoControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TempoControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-tempo-dialog";
    this.template.tempoDialog.classList.add(dialogCSSClass);
    const inputContainerCSSClass = "tu-tempo-inputs";
    this.template.tempoInputContent.classList.add(inputContainerCSSClass);
    const actionsCSSClass = "tu-tempo-actions";
    this.template.tempoActionsContent.classList.add(actionsCSSClass);

    this.template.tempoDialog.append(
      this.template.tempoInputContent,
      this.template.tempoActionsContent
    );
    this.template.tempoInputContent.append(
      this.template.textContainer,
      this.template.tempoInput,
      this.template.tempoErrorText
    );
    this.template.tempoActionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.rootDiv.appendChild(this.template.tempoDialog);
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tempo-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Edit tempo:";
  }

  private renderInputs(): void {
    const selectedElement =
      this.notationComponent.tabController.getSelectedBeat();

    let tempoInitValue: string;
    if (selectedElement !== undefined) {
      const selectedBar =
        this.notationComponent.tabController.tab.findBeatsBar(selectedElement);
      tempoInitValue = `${selectedBar.tempo}`;
    } else {
      tempoInitValue = "120";
    }

    const beatsCSSClass = "tu-tempo-input";
    this.template.tempoInput.classList.add(beatsCSSClass);
    this.template.tempoInput.type = "number";
    this.template.tempoInput.value = tempoInitValue;
    const beatsErrorCSSClass = "tu-tempo-error";
    this.template.tempoErrorText.classList.add(beatsErrorCSSClass);
  }

  private renderButtons(): void {
    const confirmCssClass = "tu-tempo-confirm-button";
    this.template.confirmButton.classList.add(confirmCssClass);
    this.template.confirmButton.textContent = "Confirm";

    const cancelCssClass = "tu-tempo-cancel-button";
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
