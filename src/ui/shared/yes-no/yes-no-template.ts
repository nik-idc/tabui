import { createButton, createDialog, createDiv } from "@/shared";

export class YesNoTemplate {
  readonly yesNoDialog: HTMLDialogElement = createDialog();
  readonly yesNoDialogContent: HTMLDivElement = createDiv();

  readonly yesNoInfoContainer: HTMLDivElement = createDiv();
  readonly yesNoText: HTMLDivElement = createDiv();

  readonly yesNoActionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
