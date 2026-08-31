import { createButton, createDialog, createDiv } from "../../../../shared";

export class TempoControlsTemplate {
  readonly dialog: HTMLDialogElement;
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly valueControl: HTMLDivElement = createDiv();
  readonly decreaseTenButton: HTMLButtonElement = createButton();
  readonly decreaseButton: HTMLButtonElement = createButton();
  readonly value: HTMLDivElement = createDiv();
  readonly increaseButton: HTMLButtonElement = createButton();
  readonly increaseTenButton: HTMLButtonElement = createButton();
  readonly errorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
