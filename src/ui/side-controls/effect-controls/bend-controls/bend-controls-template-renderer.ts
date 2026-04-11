import { NotationComponent } from "@/notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "@/ui/shared";
import { BendControlsTemplate } from "./bend-controls-template";

export class BendControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: BendControlsTemplate;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: BendControlsTemplate
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
      "tu-bend-controls-dialog",
      this.template.dialogContent,
      "tu-bend-controls-content",
      [
        {
          element: this.template.bendSelectorContent,
          className: "tu-bend-controls-selector-content",
          children: [
            this.template.bendTypeListContainer,
            this.template.bendSelectorGraphSVG,
          ],
        },
        {
          element: this.template.actionsContent,
          className: "tu-bend-controls-actions-content",
          children: [this.template.confirmButton, this.template.cancelButton],
        },
      ]
    );

    this.template.bendTypeListContainer.append(
      ...this.template.bendTypesButtons
    );
  }

  private renderBendTypesList(): void {
    const cssClass = "tu-bend-types";
    this.template.bendTypeListContainer.classList.add(cssClass);

    this.template.bendTypesButtons[0].textContent = "Bend";
    this.template.bendTypesButtons[1].textContent = "Prebend";
    this.template.bendTypesButtons[2].textContent = "Bend / Release";
    this.template.bendTypesButtons[3].textContent = "Prebend / Release";
  }

  private renderSVGGraph(): void {
    const cssClass = "tu-bend-controls-svg";
    this.template.bendSelectorGraphSVG.classList.add(cssClass);
    this.template.bendSelectorGraphSVG.setAttribute("width", "420px");
    this.template.bendSelectorGraphSVG.setAttribute("height", "300px");
  }

  private renderActionButtons(): void {
    const cssClass = "tu-bend-controls-actions";
    this.template.actionsContent.classList.add(cssClass);
    setupDialogActionButtons(
      this.template.confirmButton,
      this.template.cancelButton,
      "tu-bend-controls-confirm-button",
      "tu-bend-controls-cancel-button"
    );
  }

  public render(): void {
    this.renderBendTypesList();
    this.renderSVGGraph();
    this.renderActionButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
