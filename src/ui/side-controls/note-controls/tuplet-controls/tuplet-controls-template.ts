import { createButton, createDialog, createDiv, createInput } from "@/shared";

export class TupletControlsTemplate {
  readonly dialog: HTMLDialogElement = createDialog();
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly normalInput: HTMLInputElement = createInput();
  readonly normalErrorText: HTMLDivElement = createDiv();
  readonly input: HTMLInputElement = createInput();
  readonly tupletErrorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
