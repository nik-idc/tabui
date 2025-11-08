import { NotationComponent } from "@/notation/notation-component";
import { TupletControlsTemplate } from "./tuplet-controls-template";

export class TupletControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TupletControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TupletControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-tuplet-dialog";
    this.template.tupletDialog.classList.add(dialogCSSClass);
    const dialogContentCSSClass = "tu-tuplet-dialog-content";
    this.template.tupletDialogContent.classList.add(dialogContentCSSClass);
    const inputContainerCSSClass = "tu-tuplet-inputs";
    this.template.tupletInputContent.classList.add(inputContainerCSSClass);
    const actionsCSSClass = "tu-tuplet-actions";
    this.template.tupletActionsContent.classList.add(actionsCSSClass);

    this.template.tupletDialog.append(this.template.tupletDialogContent);
    this.template.tupletDialogContent.append(
      this.template.tupletInputContent,
      this.template.tupletActionsContent
    );
    this.template.tupletInputContent.append(
      this.template.textContainer,
      this.template.normalInput,
      this.template.normalErrorText,
      this.template.tupletInput,
      this.template.tupletErrorText
    );
    this.template.tupletActionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.rootDiv.appendChild(this.template.tupletDialog);
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tuplet-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Custom tuplet:";
  }

  private renderInputs(): void {
    const selectedElement =
      this.notationComponent.tabController.getSelectedBeat();

    let normalInitValue: string;
    let tupletInitValue: string;
    if (
      selectedElement !== undefined &&
      selectedElement.tupletSettings !== undefined
    ) {
      normalInitValue = `${selectedElement.tupletSettings.normalCount}`;
      tupletInitValue = `${selectedElement.tupletSettings.tupletCount}`;
    } else {
      normalInitValue = "3";
      tupletInitValue = "2";
    }

    const inputCSSClass = "tu-tuplet-input";
    const tupletErrorCSSClass = "tu-tuplet-error";
    this.template.normalInput.classList.add(inputCSSClass);
    this.template.normalInput.type = "number";
    this.template.normalInput.value = tupletInitValue;
    this.template.normalErrorText.classList.add(tupletErrorCSSClass);
    this.template.tupletInput.classList.add(inputCSSClass);
    this.template.tupletInput.type = "number";
    this.template.tupletInput.value = tupletInitValue;
    this.template.tupletErrorText.classList.add(tupletErrorCSSClass);
  }

  private renderButtons(): void {
    const confirmCssClass = "tu-tuplet-confirm-button";
    this.template.confirmButton.classList.add(confirmCssClass);
    this.template.confirmButton.textContent = "Confirm";

    const cancelCssClass = "tu-tuplet-cancel-button";
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
