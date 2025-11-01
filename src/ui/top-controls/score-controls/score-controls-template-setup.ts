import { NotationView } from "@/notation/notation-view";
import { createOption } from "@/shared";
import { ScoreControlsTemplate } from "./score-controls-template";

const assetsPath = import.meta.env.BASE_URL;

// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!
const minVolume = 0;
const maxVolume = 100;
const volumeStep = 5;
const minPanning = -1;
const maxPanning = 1;
const panningStep = 0.05;
// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!

function setupContainer(template: ScoreControlsTemplate): void {
  const cssClass = "tu-score-controls";
  template.scoreControlsContainer.classList.add(cssClass);
}

function setupMasterContainer(template: ScoreControlsTemplate): void {
  const cssClass = "tu-master-controls";
  template.masterContainer.classList.add(cssClass);
  template.scoreControlsContainer.appendChild(template.masterContainer);
}

function setupNewTrackButton(template: ScoreControlsTemplate): void {
  const cssClass = "tu-new-track-button";
  template.newTrackButton.classList.add(cssClass);
  const src = `${assetsPath}/img/ui/add.svg`;
  template.newTrackButton.src = src;
  template.newTrackButton.alt = "New track";

  template.masterContainer.appendChild(template.newTrackButton);
}

function setupMasterVolumeInput(template: ScoreControlsTemplate): void {
  const cssClass = "tu-master-volume-input";
  template.masterVolumeInput.classList.add(cssClass);
  template.masterVolumeInput.type = "range";
  template.masterVolumeInput.min = `${minVolume}`;
  template.masterVolumeInput.max = `${maxVolume}`;
  template.masterVolumeInput.step = `${volumeStep}`;

  template.masterVolumeInput.value = `${(minVolume + maxVolume) / 2}`;

  template.masterContainer.appendChild(template.masterVolumeInput);
}

function setupMasterPanningInput(template: ScoreControlsTemplate): void {
  const cssClass = "tu-master-panning-input";
  template.masterPanningInput.classList.add(cssClass);
  template.masterPanningInput.type = "range";
  template.masterPanningInput.min = `${minPanning}`;
  template.masterPanningInput.max = `${maxPanning}`;
  template.masterPanningInput.step = `${panningStep}`;

  template.masterPanningInput.value = `${0}`;

  template.masterContainer.appendChild(template.masterPanningInput);
}

function setupScoreSettingsButton(template: ScoreControlsTemplate): void {
  const cssClass = "tu-score-settings-button";
  template.scoreSettingsButton.classList.add(cssClass);
  const src = `${assetsPath}/img/ui/settings.svg`;
  template.scoreSettingsButton.src = src;
  template.scoreSettingsButton.alt = "Score settings";

  template.masterContainer.appendChild(template.scoreSettingsButton);
}

function setupTracksContainer(template: ScoreControlsTemplate): void {
  const cssClass = "tu-tracks";
  template.tracksContainer.classList.add(cssClass);

  template.scoreControlsContainer.appendChild(template.tracksContainer);
}

/**
 * Responsible for setting up the template of score controls:
 * - Master controls
 * - Track controls
 */
export function setupScoreControls(
  rootDiv: HTMLDivElement,
  notationView: NotationView,
  template: ScoreControlsTemplate
): void {
  setupContainer(template);
  setupMasterContainer(template);
  setupNewTrackButton(template);
  setupMasterVolumeInput(template);
  setupMasterPanningInput(template);
  setupScoreSettingsButton(template);
  setupTracksContainer(template);

  rootDiv.appendChild(template.scoreControlsContainer);
}
