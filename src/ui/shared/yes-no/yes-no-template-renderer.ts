import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "@/ui/shared";
import { YesNoTemplate } from "./yes-no-template";

export class YesNoTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: YesNoTemplate;

  private _assembled: boolean;

  private _text: string;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: YesNoTemplate,
    text: string
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this._text = text;

    this._assembled = false;
  }

  private assembleContainer(): void {
    assembleDialog(
      this.parentDiv,
      this.template.yesNoDialog,
      "tu-yes-no-dialog",
      this.template.yesNoDialogContent,
      "tu-yes-no-dialog-content",
      [
        {
          element: this.template.yesNoInfoContainer,
          className: "tu-yes-no-info-container",
          children: [this.template.yesNoText],
        },
        {
          element: this.template.yesNoActionsContent,
          className: "tu-yes-no-actions-container",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );
  }

  private renderText(): void {
    const cssClass = "tu-yes-no-text";
    this.template.yesNoText.classList.add(cssClass);
    this.template.yesNoText.textContent = this._text;
  }

  private renderButtons(): void {
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-yes-no-confirm-button",
      "tu-yes-no-cancel-button"
    );
  }

  public render(): void {
    this.renderText();
    this.renderButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
