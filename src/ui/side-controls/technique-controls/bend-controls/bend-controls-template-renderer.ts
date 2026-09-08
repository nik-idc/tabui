import { NotationComponent } from "../../../../notation/notation-component";
import {
  assembleDialog,
  renderOnce,
  setupDialogActionButtons,
} from "../../../shared";
import {
  BEND_TYPE_BUTTON_ORDER,
  BendControlsTemplate,
} from "./bend-controls-template";
import { BendType } from "../../../../notation/model";

const bendTypeLabels: Record<BendType, string> = {
  [BendType.Bend]: "Bend",
  [BendType.BendAndRelease]: "Bend / Release",
  [BendType.Hold]: "Hold",
  [BendType.Prebend]: "Prebend",
  [BendType.PrebendAndRelease]: "Prebend / Release",
  [BendType.PrebendBend]: "Prebend / Bend",
  [BendType.Release]: "Release",
};

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
      this.template.dialogContainer,
      "tu-bend-controls-dialog",
      "Bend",
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
          children: [
            this.template.confirmButton,
            this.template.removeButton,
            this.template.cancelButton,
          ],
        },
      ]
    );
    this.template.dialogContainer.setAttribute(
      "aria-description",
      "Pitch uses half-semitone steps. Tab moves between controls. " +
        "Arrow keys adjust pitch and duration."
    );

    this.template.bendTypeListContainer.append(
      ...BEND_TYPE_BUTTON_ORDER.map(
        (bendType) => this.template.bendTypesButtons[bendType]
      )
    );
  }

  private renderBendTypesList(): void {
    const cssClass = "tu-bend-types";
    this.template.bendTypeListContainer.classList.add(cssClass);

    for (const bendType of BEND_TYPE_BUTTON_ORDER) {
      this.template.bendTypesButtons[bendType].textContent =
        bendTypeLabels[bendType];
    }
  }

  private renderSVGGraph(): void {
    const cssClass = "tu-bend-controls-svg";
    this.template.bendSelectorGraphSVG.classList.add(cssClass);
    this.template.bendSelectorGraphSVG.setAttribute("width", "420px");
    this.template.bendSelectorGraphSVG.setAttribute("height", "300px");
    this.template.bendSelectorGraphSVG.setAttribute("role", "group");
    this.template.bendSelectorGraphSVG.setAttribute(
      "aria-label",
      "Bend curve editor"
    );
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
    this.template.removeButton.textContent = "Remove";
    this.template.removeButton.classList.add("tu-bend-controls-remove-button");
  }

  public setSelectedBendType(selectedType: BendType): void {
    for (const bendType of BEND_TYPE_BUTTON_ORDER) {
      this.template.bendTypesButtons[bendType].classList.toggle(
        "tu-applied-button",
        bendType === selectedType
      );
      this.template.bendTypesButtons[bendType].setAttribute(
        "aria-pressed",
        `${bendType === selectedType}`
      );
    }
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
