import { createButton, createDialog, createDiv, createSVG } from "@/shared";

type BendTypesButtons = [
  HTMLButtonElement, // Regular bend button
  HTMLButtonElement, // Prebend button
  HTMLButtonElement, // Bend & release button
  HTMLButtonElement, // Prebend & release button
];

export class BendControlsTemplate {
  readonly dialog: HTMLDialogElement = createDialog();
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly bendSelectorContent: HTMLDivElement = createDiv();
  readonly bendTypeListContainer: HTMLDivElement = createDiv();
  readonly bendTypesButtons: BendTypesButtons = [
    createButton(),
    createButton(),
    createButton(),
    createButton(),
  ];
  readonly bendSelectorGraphSVG: SVGSVGElement = createSVG();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
