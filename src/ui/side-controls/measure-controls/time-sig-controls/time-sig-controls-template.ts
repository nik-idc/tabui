import { createButton, createDialog, createDiv, createInput } from "@/shared";

export class TimeSigControlsTemplate {
  readonly dialog: HTMLDialogElement = createDialog();
  readonly dialogContent: HTMLDivElement = createDiv();

  readonly inputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly beatsInput: HTMLInputElement = createInput();
  readonly beatsErrorText: HTMLDivElement = createDiv();
  readonly durationInput: HTMLInputElement = createInput();
  readonly durationErrorText: HTMLDivElement = createDiv();

  readonly actionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
