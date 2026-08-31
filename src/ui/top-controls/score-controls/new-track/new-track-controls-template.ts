import {
  createButton,
  createDialog,
  createDiv,
  createImage,
  createInput,
  createSVG,
} from "../../../../shared";

export class NewTrackControlsTemplate {
  readonly dialog: HTMLDialogElement;
  /**/ readonly dialogContent: HTMLDivElement = createDiv();
  /****/ readonly settingsContainer: HTMLDivElement = createDiv();
  /******/ readonly instrFamiliesContainer: HTMLDivElement = createDiv();
  /********/ readonly instrFamiliesButtons: HTMLImageElement[] = [];
  /******/ readonly instrSelectContainer: HTMLDivElement = createDiv();
  /********/ readonly instrTypesContainer: HTMLDivElement = createDiv();
  /**********/ readonly instrTypesButtons: HTMLButtonElement[] = [];
  /********/ readonly instrTonesContainer: HTMLDivElement = createDiv();
  /**********/ readonly instrTonesButtons: HTMLButtonElement[] = [];
  /******/ readonly trackInfoContainer: HTMLDivElement = createDiv();
  /********/ readonly trackNameInput: HTMLInputElement = createInput();
  /********/ readonly trackNameError: HTMLDivElement = createDiv();
  /********/ readonly stringCountContainer: HTMLDivElement = createDiv();
  /**********/ readonly stringCountDownButton: HTMLButtonElement =
    createButton();
  /**********/ readonly stringCountValue: HTMLDivElement = createDiv();
  /**********/ readonly stringCountUpButton: HTMLButtonElement = createButton();
  /********/ readonly stringCountError: HTMLDivElement = createDiv();
  /********/ readonly tuningContainer: HTMLDivElement = createDiv();
  /**********/ readonly tuningStringContainers: HTMLDivElement[] = [];
  /**********/ readonly tuningStringLabels: HTMLDivElement[] = [];
  /**********/ readonly tuningNoteLabels: HTMLDivElement[] = [];
  /**********/ readonly tuningUpButtons: HTMLButtonElement[] = [];
  /**********/ readonly tuningDownButtons: HTMLButtonElement[] = [];
  /********/ readonly wholeTuningContainer: HTMLDivElement = createDiv();
  /**********/ readonly wholeTuningUpButton: HTMLButtonElement = createButton();
  /**********/ readonly wholeTuningDownButton: HTMLButtonElement =
    createButton();
  /********/ readonly tuningError: HTMLDivElement = createDiv();
  /****/ readonly actionsContainer: HTMLDivElement = createDiv();
  /******/ readonly confirmButton: HTMLButtonElement = createButton();
  /******/ readonly cancelButton: HTMLButtonElement = createButton();

  constructor(dialogHost: HTMLDivElement) {
    this.dialog = createDialog(dialogHost);
  }
}
