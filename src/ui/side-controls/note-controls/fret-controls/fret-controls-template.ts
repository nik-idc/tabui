import { createButton, createDiv, createInput } from "../../../../shared";

/** Template elements for editing the selected note's fret. */
export class FretControlsTemplate {
  readonly dialogContainer: HTMLDivElement = createDiv();
  readonly dialogContent: HTMLFormElement = document.createElement("form");
  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly valueControl: HTMLDivElement = createDiv();
  readonly noFretButton: HTMLButtonElement = createButton();
  readonly deadButton: HTMLButtonElement = createButton();
  readonly input: HTMLInputElement = createInput();
  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
