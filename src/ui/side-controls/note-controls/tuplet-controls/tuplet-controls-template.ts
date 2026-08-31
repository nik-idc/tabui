import { createButton, createDialog, createDiv } from "../../../../shared";

export class TupletControlsTemplate {
  readonly dialog: HTMLDialogElement;
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly normalLabel: HTMLDivElement = createDiv();
  readonly normalControl: HTMLDivElement = createDiv();
  readonly normalDownButton: HTMLButtonElement = createButton();
  readonly normalValue: HTMLDivElement = createDiv();
  readonly normalUpButton: HTMLButtonElement = createButton();
  readonly normalErrorText: HTMLDivElement = createDiv();
  readonly tupletLabel: HTMLDivElement = createDiv();
  readonly tupletControl: HTMLDivElement = createDiv();
  readonly tupletDownButton: HTMLButtonElement = createButton();
  readonly tupletValue: HTMLDivElement = createDiv();
  readonly tupletUpButton: HTMLButtonElement = createButton();
  readonly tupletErrorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
