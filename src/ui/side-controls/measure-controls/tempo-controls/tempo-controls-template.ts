import { createButton, createDiv } from "../../../../shared";

export class TempoControlsTemplate {
  readonly dialogContainer: HTMLDivElement = createDiv();
  readonly dialogContent: HTMLFormElement = document.createElement("form");

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly valueControl: HTMLDivElement = createDiv();
  readonly decreaseTenButton: HTMLButtonElement = createButton();
  readonly decreaseButton: HTMLButtonElement = createButton();
  readonly valueInput: HTMLInputElement = document.createElement("input");
  readonly increaseButton: HTMLButtonElement = createButton();
  readonly increaseTenButton: HTMLButtonElement = createButton();
  readonly errorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
