import {
  createButton,
  createDialog,
  createDiv,
  createImage,
  createInput,
  createSVG,
} from "@/shared";

export class TrackSettingsControlsTemplate {
  readonly dialog: HTMLDialogElement = createDialog();
  /**/ readonly dialogContent: HTMLDivElement = createDiv();
  /****/ readonly trackInfoContainer: HTMLDivElement = createDiv();
  /******/ readonly trackNameInput: HTMLInputElement = createInput();
  /******/ readonly trackNameError: HTMLDivElement = createDiv();
  /******/ readonly stringCountInput: HTMLInputElement = createInput();
  /******/ readonly stringCountError: HTMLDivElement = createDiv();
  /******/ readonly tuningInput: HTMLInputElement = createInput();
  /******/ readonly tuningError: HTMLDivElement = createDiv();
  /****/ readonly actionsContainer: HTMLDivElement = createDiv();
  /******/ readonly confirmButton: HTMLButtonElement = createButton();
  /******/ readonly cancelButton: HTMLButtonElement = createButton();
}
