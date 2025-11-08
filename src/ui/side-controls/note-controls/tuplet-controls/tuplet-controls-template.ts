import { createButton, createDialog, createDiv, createInput } from "@/shared";

export class TupletControlsTemplate {
  readonly tupletDialog: HTMLDialogElement = createDialog();
  readonly tupletDialogContent: HTMLDivElement = createDiv();

  readonly tupletInputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly normalInput: HTMLInputElement = createInput();
  readonly normalErrorText: HTMLDivElement = createDiv();
  readonly tupletInput: HTMLInputElement = createInput();
  readonly tupletErrorText: HTMLDivElement = createDiv();

  readonly tupletActionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
