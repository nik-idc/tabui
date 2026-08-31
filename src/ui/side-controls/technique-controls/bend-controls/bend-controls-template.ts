import {
  createButton,
  createDialog,
  createDiv,
  createSVG,
} from "../../../../shared";
import { BendType } from "../../../../notation/model";

export const BEND_TYPE_BUTTON_ORDER = [
  BendType.Bend,
  BendType.Prebend,
  BendType.BendAndRelease,
  BendType.PrebendAndRelease,
  BendType.PrebendBend,
  BendType.Hold,
  BendType.Release,
] as const;

export class BendControlsTemplate {
  readonly dialog: HTMLDialogElement;
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly bendSelectorContent: HTMLDivElement = createDiv();
  readonly bendTypeListContainer: HTMLDivElement = createDiv();
  readonly bendTypesButtons: Record<BendType, HTMLButtonElement> = {
    [BendType.Bend]: createButton(),
    [BendType.BendAndRelease]: createButton(),
    [BendType.Hold]: createButton(),
    [BendType.Prebend]: createButton(),
    [BendType.PrebendAndRelease]: createButton(),
    [BendType.PrebendBend]: createButton(),
    [BendType.Release]: createButton(),
  };
  readonly bendSelectorGraphSVG: SVGSVGElement = createSVG();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
  readonly removeButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
