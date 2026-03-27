import { NotationComponent } from "@/notation/notation-component";
import { BendControlsTemplate } from "./bend-controls-template";

export class BendControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: BendControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: BendControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-bend-controls-dialog";
    const dialogContentCSSClass = "tu-bend-controls-content";
    const selectorCSSClass = "tu-bend-controls-selector-content";
    const actionsCSSClass = "tu-bend-controls-actions-content";

    this.template.dialog.classList.add(dialogCSSClass);
    this.template.dialogContent.classList.add(dialogContentCSSClass);
    this.template.bendSelectorContent.classList.add(selectorCSSClass);
    this.template.actionsContent.classList.add(actionsCSSClass);

    this.template.dialog.appendChild(this.template.dialogContent);
    this.template.dialogContent.append(
      this.template.bendSelectorContent,
      this.template.actionsContent
    );

    this.template.bendTypeListContainer.append(
      ...this.template.bendTypesButtons
    );
    this.template.bendSelectorContent.appendChild(
      this.template.bendTypeListContainer
    );

    this.template.bendSelectorContent.appendChild(
      this.template.bendSelectorGraphSVG
    );

    this.template.actionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.template.dialogContent.appendChild(this.template.actionsContent);

    this.parentDiv.appendChild(this.template.dialog);
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

    this.template.confirmButton.textContent = "Confirm";
    this.template.cancelButton.textContent = "Cancel";
  }

  public render(): void {
    this.renderBendTypesList();
    this.renderSVGGraph();
    this.renderActionButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
