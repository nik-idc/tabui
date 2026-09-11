import {
  createButton,
  createDiv,
  createInput,
  createSVG,
} from "../../../../../shared";

export class TrackSettingsControlsTemplate {
  readonly dialogContainer: HTMLDivElement = createDiv();
  /**/ readonly dialogContent: HTMLFormElement = document.createElement("form");
  /****/ readonly settingsContainer: HTMLDivElement = createDiv();
  /******/ readonly instrFamiliesContainer: HTMLDivElement = createDiv();
  /********/ readonly instrFamiliesButtons: HTMLButtonElement[] = [];
  /******/ readonly instrSelectContainer: HTMLDivElement = createDiv();
  /********/ readonly instrTypesContainer: HTMLDivElement = createDiv();
  /**********/ readonly instrTypesButtons: HTMLButtonElement[] = [];
  /********/ readonly instrTonesContainer: HTMLDivElement = createDiv();
  /**********/ readonly instrTonesButtons: HTMLButtonElement[] = [];
  /****/ readonly trackInfoContainer: HTMLDivElement = createDiv();
  /******/ readonly tuningContainer: HTMLDivElement = createDiv();
  /********/ readonly tuningStringContainers: HTMLDivElement[] = [];
  /********/ readonly tuningStringLabels: HTMLDivElement[] = [];
  /********/ readonly tuningNoteLabels: HTMLDivElement[] = [];
  /********/ readonly tuningUpButtons: HTMLButtonElement[] = [];
  /********/ readonly tuningDownButtons: HTMLButtonElement[] = [];
  /******/ readonly wholeTuningContainer: HTMLDivElement = createDiv();
  /********/ readonly wholeTuningUpButton: HTMLButtonElement = createButton();
  /********/ readonly wholeTuningDownButton: HTMLButtonElement = createButton();
  /******/ readonly tuningError: HTMLDivElement = createDiv();
  /******/ readonly tuningModeContainer: HTMLDivElement = createDiv();
  /********/ readonly keepFretsButton: HTMLButtonElement = createButton();
  /********/ readonly transposeButton: HTMLButtonElement = createButton();
  /****/ readonly actionsContainer: HTMLDivElement = createDiv();
  /******/ readonly confirmButton: HTMLButtonElement = createButton();
  /******/ readonly cancelButton: HTMLButtonElement = createButton();
}
