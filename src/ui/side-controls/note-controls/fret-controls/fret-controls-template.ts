import {
  createButton,
  createDialog,
  createDiv,
  createInput,
} from "../../../../shared";

/** Template elements for editing the selected note's fret. */
export class FretControlsTemplate {
  readonly dialog: HTMLDialogElement;
  readonly dialogContent: HTMLDivElement = createDiv();
  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly valueControl: HTMLDivElement = createDiv();
  readonly noFretButton: HTMLButtonElement = createButton();
  readonly deadButton: HTMLButtonElement = createButton();
  readonly input: HTMLInputElement = createInput();
  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
