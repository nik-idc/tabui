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
  /****/ readonly settingsContainer: HTMLDivElement = createDiv();
  /******/ readonly instrFamiliesContainer: HTMLDivElement = createDiv();
  /********/ instrFamiliesButtons: HTMLImageElement[] = [];
  /******/ readonly instrSelectContainer: HTMLDivElement = createDiv();
  /********/ readonly instrTypesContainer: HTMLDivElement = createDiv();
  /**********/ instrTypesButtons: HTMLButtonElement[] = [];
  /********/ readonly instrTonesContainer: HTMLDivElement = createDiv();
  /**********/ instrTonesButtons: HTMLButtonElement[] = [];
  /****/ readonly trackInfoContainer: HTMLDivElement = createDiv();
  /******/ readonly trackNameInput: HTMLInputElement = createInput();
  /******/ readonly trackNameError: HTMLDivElement = createDiv();
  /******/ readonly stringCountInput: HTMLInputElement = createInput();
  /******/ readonly stringCountError: HTMLDivElement = createDiv();
  /******/ readonly tuningInput: HTMLInputElement = createInput();
  /******/ readonly tuningError: HTMLDivElement = createDiv();
  /******/ readonly tuningModeContainer: HTMLDivElement = createDiv();
  /********/ readonly keepFretsButton: HTMLButtonElement = createButton();
  /********/ readonly transposeButton: HTMLButtonElement = createButton();
  /****/ readonly actionsContainer: HTMLDivElement = createDiv();
  /******/ readonly confirmButton: HTMLButtonElement = createButton();
  /******/ readonly cancelButton: HTMLButtonElement = createButton();
}
