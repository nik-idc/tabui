import { NotationComponent } from "@/notation/notation-component";
import { YesNoTemplate } from "./yes-no-template";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

export class YesNoTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: YesNoTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  private _text: string;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: YesNoTemplate,
    text: string,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;
    this._text = text;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-yes-no-dialog";
    const dialogContentCSSClass = "tu-yes-no-dialog-content";
    const infoContainerCSSClass = "tu-yes-no-info-container";
    const actionsCSSClass = "tu-yes-no-actions-container";

    this.template.yesNoDialog.classList.add(dialogCSSClass);
    this.template.yesNoDialogContent.classList.add(dialogContentCSSClass);
    this.template.yesNoInfoContainer.classList.add(infoContainerCSSClass);
    this.template.yesNoActionsContent.classList.add(actionsCSSClass);

    this.template.yesNoDialog.append(this.template.yesNoDialogContent);
    this.template.yesNoDialogContent.append(
      this.template.yesNoInfoContainer,
      this.template.yesNoActionsContent
    );
    this.template.yesNoInfoContainer.append(this.template.yesNoText);
    this.template.yesNoActionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.parentDiv.appendChild(this.template.yesNoDialog);
  }

  private renderText(): void {
    const cssClass = "tu-yes-no-text";
    this.template.yesNoText.classList.add(cssClass);
    this.template.yesNoText.textContent = this._text;
  }

  private renderButtons(): void {
    const confirmCSSClass = "tu-yes-no-confirm-button";
    const cancelCSSClass = "tu-yes-no-cancel-button";

    this.template.confirmButton.classList.add(confirmCSSClass);
    this.template.confirmButton.textContent = "Confirm";

    this.template.cancelButton.classList.add(cancelCSSClass);
    this.template.cancelButton.textContent = "Cancel";
  }

  public render(): void {
    this.renderText();
    this.renderButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
