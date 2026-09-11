import { createButton, createDiv } from "../../../shared";

export class YesNoTemplate {
  readonly dialogContainer: HTMLDivElement = createDiv();
  readonly yesNoDialogContent: HTMLFormElement = document.createElement("form");

  readonly yesNoInfoContainer: HTMLDivElement = createDiv();
  readonly yesNoText: HTMLDivElement = createDiv();

  readonly yesNoActionsContent: HTMLDivElement = createDiv();
  readonly confirmButton: HTMLButtonElement = createButton();
  readonly cancelButton: HTMLButtonElement = createButton();
}
