import { createButton, createDialog, createDiv, createInput } from "@/shared";

export class TimeSigControlsTemplate {
  readonly timeSigDialog: HTMLDialogElement = createDialog();
  readonly timeSigDialogContent: HTMLDivElement = createDiv();

  readonly timeSigInputContent: HTMLDivElement = createDiv();
  readonly textContainer: HTMLDivElement = createDiv();
  readonly beatsInput: HTMLInputElement = createInput();
  readonly beatsErrorText: HTMLDivElement = createDiv();
  readonly durationInput: HTMLInputElement = createInput();
  readonly durationErrorText: HTMLDivElement = createDiv();

  readonly timeSigActionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
