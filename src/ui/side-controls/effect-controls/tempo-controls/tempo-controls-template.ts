import { createButton, createDialog, createDiv, createInput } from "@/shared";

export class TempoControlsTemplate {
  readonly tempoDialog: HTMLDialogElement = createDialog();
  readonly tempoDialogContent: HTMLDivElement = createDiv();

  readonly tempoInputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly tempoInput: HTMLInputElement = createInput();
  readonly tempoErrorText: HTMLDivElement = createDiv();

  readonly tempoActionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
