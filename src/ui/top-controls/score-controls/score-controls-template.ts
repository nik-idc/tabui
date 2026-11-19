import { createButton, createDiv, createInput } from "../../../shared";

/**
 * Interface defining the template of score controls, the second row of the
 * top bar:
 * - Selection and copy buttons at the start
 * - Master controls in the middle
 * - History and clipboard buttons at the end
 * - Track controls
 */
export class ScoreControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  /** Works in view-only mode too. */
  /**/ readonly selectionContainer: HTMLDivElement = createDiv();
  /****/ readonly rangeButton: HTMLButtonElement = createButton();
  /****/ readonly selectAllButton: HTMLButtonElement = createButton();
  /****/ readonly copyButton: HTMLButtonElement = createButton();
  /** Changes the score, so it is hidden in view-only mode. */
  /**/ readonly editContainer: HTMLDivElement = createDiv();
  /****/ readonly undoButton: HTMLButtonElement = createButton();
  /****/ readonly redoButton: HTMLButtonElement = createButton();
  /****/ readonly cutButton: HTMLButtonElement = createButton();
  /****/ readonly pasteButton: HTMLButtonElement = createButton();
  /**/ readonly masterContainer: HTMLDivElement = createDiv();
  /****/ readonly settingsContainer: HTMLDivElement = createDiv();
  /******/ readonly showTracksButton: HTMLButtonElement = createButton();
  /******/ readonly newTrackButton: HTMLButtonElement = createButton();
  /******/ readonly masterVolumeControls: HTMLDivElement = createDiv();
  /******/ readonly masterPanningControls: HTMLDivElement = createDiv();
  /******/ readonly masterVolumeInput: HTMLInputElement = createInput();
  /******/ readonly masterPanningInput: HTMLInputElement = createInput();
  /**/ readonly tracksContainer: HTMLDivElement = createDiv();
  /** Scrolls; the container around it does not. */
  /****/ readonly trackList: HTMLDivElement = createDiv();
}
