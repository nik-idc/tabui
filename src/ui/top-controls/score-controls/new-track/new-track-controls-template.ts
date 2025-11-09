import {
  createButton,
  createDialog,
  createDiv,
  createImage,
  createInput,
  createSVG,
} from "@/shared";

export class NewTrackControlsTemplate {
  readonly newTrackDialog: HTMLDialogElement = createDialog();
  /**/ readonly newTrackDialogContent: HTMLDivElement = createDiv();
  /****/ readonly newTrackSettingsContainer: HTMLDivElement = createDiv();
  /******/ readonly instrKindsContainer: HTMLDivElement = createDiv();
  /********/ readonly instrKindsButtons: HTMLImageElement[] = [];
  /******/ readonly instrSelectContainer: HTMLDivElement = createDiv();
  /********/ readonly instrTypesContainer: HTMLDivElement = createDiv();
  /**********/ instrTypesButtons: HTMLButtonElement[] = [];
  /********/ readonly instrPresetsContainer: HTMLDivElement = createDiv();
  /**********/ instrPresetsButtons: HTMLButtonElement[] = [];
  /******/ readonly trackInfoContainer: HTMLDivElement = createDiv();
  /********/ readonly trackNameInput: HTMLInputElement = createInput();
  /********/ readonly trackNameError: HTMLDivElement = createDiv();
  /********/ readonly stringCountInput: HTMLInputElement = createInput();
  /********/ readonly stringCountError: HTMLDivElement = createDiv();
  /********/ readonly tuningInput: HTMLInputElement = createInput();
  /********/ readonly tuningError: HTMLDivElement = createDiv();
  /****/ readonly newTrackActionsContainer: HTMLDivElement = createDiv();
  /******/ readonly confirmButton: HTMLButtonElement = createButton();
  /******/ readonly cancelButton: HTMLButtonElement = createButton();
}
