import { NotationComponent } from "@/notation/notation-component";
import { TupletControlsTemplate } from "./tuplet-controls-template";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

export class TupletControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: TupletControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: TupletControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-tuplet-dialog";
    this.template.dialog.classList.add(dialogCSSClass);
    const dialogContentCSSClass = "tu-tuplet-dialog-content";
    this.template.dialogContent.classList.add(dialogContentCSSClass);
    const inputContainerCSSClass = "tu-tuplet-inputs";
    this.template.inputContent.classList.add(inputContainerCSSClass);
    const actionsCSSClass = "tu-tuplet-actions";
    this.template.actionsContent.classList.add(actionsCSSClass);

    this.template.dialog.append(this.template.dialogContent);
    this.template.dialogContent.append(
      this.template.inputContent,
      this.template.actionsContent
    );
    this.template.inputContent.append(
      this.template.textContainer,
      this.template.normalInput,
      this.template.normalErrorText,
      this.template.input,
      this.template.tupletErrorText
    );
    this.template.actionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.parentDiv.appendChild(this.template.dialog);
  }

  private renderTextContainer(): void {
    const cssClass = "tu-tuplet-text";
    this.template.textContainer.classList.add(cssClass);
    this.template.textContainer.textContent = "Custom tuplet:";
  }

  private renderInputs(): void {
    const selectedNote =
      this.notationComponent.trackController.trackControllerEditor
        .selectionManager.selectedNote;

    let normalInitValue: string;
    let tupletInitValue: string;
    if (
      selectedNote !== undefined &&
      selectedNote.beat.tupletSettings !== null
    ) {
      normalInitValue = `${selectedNote.beat.tupletSettings.normalCount}`;
      tupletInitValue = `${selectedNote.beat.tupletSettings.tupletCount}`;
    } else {
      normalInitValue = "3";
      tupletInitValue = "2";
    }

    const inputCSSClass = "tu-tuplet-input";
    const tupletErrorCSSClass = "tu-tuplet-error";
    this.template.normalInput.classList.add(inputCSSClass);
    this.template.normalInput.type = "number";
    this.template.normalInput.value = normalInitValue;
    this.template.normalErrorText.classList.add(tupletErrorCSSClass);
    this.template.input.classList.add(inputCSSClass);
    this.template.input.type = "number";
    this.template.input.value = tupletInitValue;
    this.template.tupletErrorText.classList.add(tupletErrorCSSClass);
  }

  private renderButtons(): void {
    const confirmCSSClass = "tu-tuplet-confirm-button";
    this.template.confirmButton.classList.add(confirmCSSClass);
    this.template.confirmButton.textContent = "Confirm";

    const cancelCSSClass = "tu-tuplet-cancel-button";
    this.template.cancelButton.classList.add(cancelCSSClass);
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
