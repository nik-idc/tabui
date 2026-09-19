import { createButton, createDiv, createInput } from "../../../../shared";

export class RepeatCountControlsTemplate {
  readonly dialogContainer: HTMLDivElement = createDiv();
  readonly dialogContent: HTMLFormElement = document.createElement("form");
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
}
