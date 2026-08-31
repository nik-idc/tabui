import {
  createButton,
  createDialog,
  createDiv,
  createInput,
} from "../../../../shared";

export class RepeatCountControlsTemplate {
  readonly dialog: HTMLDialogElement;
  readonly dialogContent: HTMLDivElement = createDiv();
  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly valueControl: HTMLDivElement = createDiv();
  readonly decreaseButton: HTMLButtonElement = createButton();
  readonly value: HTMLInputElement = createInput();
  readonly increaseButton: HTMLButtonElement = createButton();
  readonly errorText: HTMLDivElement = createDiv();
  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
  readonly removeButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
