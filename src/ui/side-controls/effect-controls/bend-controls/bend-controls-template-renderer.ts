import { NotationComponent } from "@/notation/notation-component";
import { BendControlsTemplate } from "./bend-controls-template";

export class BendControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: BendControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: BendControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const dialogCSSClass = "tu-bend-controls-dialog";
    this.template.bendControlsDialog.classList.add(dialogCSSClass);

    const dialogContentCSSClass = "tu-bend-controls-content";
    this.template.bendControlsDialogContent.classList.add(
      dialogContentCSSClass
    );
    const selectorCSSClass = "tu-bend-controls-selector-content";
    this.template.bendSelectorContent.classList.add(selectorCSSClass);
    const actionsCSSClass = "tu-bend-controls-actions-content";
    this.template.bendActionsContent.classList.add(actionsCSSClass);

    this.template.bendControlsDialog.appendChild(
      this.template.bendControlsDialogContent
    );
    this.template.bendControlsDialogContent.append(
      this.template.bendSelectorContent,
      this.template.bendActionsContent
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

    this.template.bendActionsContent.append(
      this.template.confirmButton,
      this.template.cancelButton
    );
    this.template.bendControlsDialogContent.appendChild(
      this.template.bendActionsContent
    );

    this.rootDiv.appendChild(this.template.bendControlsDialog);
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
    this.template.bendActionsContent.classList.add(cssClass);

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

function setupBendControlsDialog(template: BendControlsTemplate): void {
  const dialogCSSClass = "tu-bend-controls-dialog";
  template.bendControlsDialog.classList.add(dialogCSSClass);

  const dialogContentCSSClass = "tu-bend-controls-content";
  template.bendControlsDialogContent.classList.add(dialogContentCSSClass);
  const selectorCSSClass = "tu-bend-controls-selector-content";
  template.bendSelectorContent.classList.add(selectorCSSClass);
  const actionsCSSClass = "tu-bend-controls-actions-content";
  template.bendActionsContent.classList.add(actionsCSSClass);

  template.bendControlsDialog.appendChild(template.bendControlsDialogContent);
  template.bendControlsDialogContent.append(
    template.bendSelectorContent,
    template.bendActionsContent
  );
}

function setupBendTypesList(template: BendControlsTemplate): void {
  const cssClass = "tu-bend-types";
  template.bendTypeListContainer.classList.add(cssClass);

  template.bendTypesButtons[0].textContent = "Bend";
  template.bendTypesButtons[1].textContent = "Prebend";
  template.bendTypesButtons[2].textContent = "Bend / Release";
  template.bendTypesButtons[3].textContent = "Prebend / Release";

  template.bendTypeListContainer.append(...template.bendTypesButtons);
  template.bendSelectorContent.appendChild(template.bendTypeListContainer);
}

function setupSVGGraph(template: BendControlsTemplate): void {
  const cssClass = "tu-bend-controls-svg";
  template.bendSelectorGraphSVG.classList.add(cssClass);
  template.bendSelectorGraphSVG.setAttribute("width", "420px");
  template.bendSelectorGraphSVG.setAttribute("height", "300px");

  template.bendSelectorContent.appendChild(template.bendSelectorGraphSVG);
}

function setupActionButtons(template: BendControlsTemplate): void {
  const cssClass = "tu-bend-controls-actions";
  template.bendActionsContent.classList.add(cssClass);

  template.confirmButton.textContent = "Confirm";
  template.cancelButton.textContent = "Cancel";

  template.bendActionsContent.append(
    template.confirmButton,
    template.cancelButton
  );
  template.bendControlsDialogContent.appendChild(template.bendActionsContent);
}

/**
 * Responsible for setting up the template of bend controls:
 * - Bend types list
 * - Actions (confirm / cancel)
 */
export function setupBendControls(
  rootDiv: HTMLDivElement,
  template: BendControlsTemplate
): void {
  setupBendControlsDialog(template);
  setupBendTypesList(template);
  setupSVGGraph(template);
  setupActionButtons(template);

  rootDiv.appendChild(template.bendControlsDialog);
}
