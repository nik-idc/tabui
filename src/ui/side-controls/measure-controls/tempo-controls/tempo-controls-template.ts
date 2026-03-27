import { createButton, createDialog, createDiv, createInput } from "@/shared";

export class TempoControlsTemplate {
  readonly dialog: HTMLDialogElement = createDialog();
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly input: HTMLInputElement = createInput();
  readonly errorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
