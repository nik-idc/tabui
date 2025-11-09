import {
  createButton,
  createDialog,
  createDiv,
  createImage,
  createInput,
  createSVG,
} from "@/shared";

export class TrackSettingsControlsTemplate {
  readonly trackSettingsDialog: HTMLDialogElement = createDialog();
  /**/ readonly trackSettingsDialogContent: HTMLDivElement = createDiv();
  /****/ readonly trackInfoContainer: HTMLDivElement = createDiv();
  /******/ readonly trackNameInput: HTMLInputElement = createInput();
  /******/ readonly trackNameError: HTMLDivElement = createDiv();
  /******/ readonly stringCountInput: HTMLInputElement = createInput();
  /******/ readonly stringCountError: HTMLDivElement = createDiv();
  /******/ readonly tuningInput: HTMLInputElement = createInput();
  /******/ readonly tuningError: HTMLDivElement = createDiv();
  /****/ readonly trackSettingsActionsContainer: HTMLDivElement = createDiv();
  /******/ readonly confirmButton: HTMLButtonElement = createButton();
  /******/ readonly cancelButton: HTMLButtonElement = createButton();
}
