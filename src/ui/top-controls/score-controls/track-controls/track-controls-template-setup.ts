import { NotationView } from "@/notation/notation-view";
import { createOption } from "@/shared";
import { TrackControlsTemplate } from "./track-controls-template";
import { Tab, Track } from "@/notation";

const assetsPath = import.meta.env.BASE_URL;

// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!
const minVolume = 0;
const maxVolume = 100;
const volumeStep = 5;
const minPanning = -1;
const maxPanning = 1;
const panningStep = 0.05;
// VERY BAD!!! VERY VERY BAD!!!! SHOULD CHANGE ASAP!!!

function setupContainer(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-controls";
  template.trackControlsContainer.classList.add(cssClass);
}

function setupTrackName(
  template: TrackControlsTemplate,
  notationView: NotationView,
  track: Tab
): void {
  const cssClass = "tu-track-name";
  template.trackName.classList.add(cssClass);
  template.trackName.textContent = track.name;

  template.trackControlsContainer.appendChild(template.trackName);
}

function setupRemoveButton(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-remove-button";
  template.muteButton.classList.add(cssClass);
  const src = `${assetsPath}/img/ui/remove.svg`;
  template.removeButton.src = src;
  template.removeButton.alt = "Remove";

  template.trackControlsContainer.appendChild(template.removeButton);
}

function setupVolumeInput(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-volume-input";
  template.volumeInput.classList.add(cssClass);
  template.volumeInput.type = "range";
  template.volumeInput.min = `${minVolume}`;
  template.volumeInput.max = `${maxVolume}`;
  template.volumeInput.step = `${volumeStep}`;

  template.volumeInput.value = `${(minVolume + maxVolume) / 2}`;

  template.trackControlsContainer.appendChild(template.volumeInput);
}

function setupPanningInput(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-panning-input";
  template.panningInput.classList.add(cssClass);
  template.panningInput.type = "range";
  template.panningInput.min = `${minPanning}`;
  template.panningInput.max = `${maxPanning}`;
  template.panningInput.step = `${panningStep}`;

  template.panningInput.value = `${0}`;

  template.trackControlsContainer.appendChild(template.panningInput);
}

function setupMuteButton(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-mute-button";
  template.muteButton.classList.add(cssClass);
  const src = `${assetsPath}/img/ui/mute.svg`;
  template.muteButton.src = src;
  template.muteButton.alt = "Mute";

  template.trackControlsContainer.appendChild(template.muteButton);
}

function setupSoloButton(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-solo-button";
  template.soloButton.classList.add(cssClass);
  const src = `${assetsPath}/img/ui/solo.svg`;
  template.soloButton.src = src;
  template.soloButton.alt = "Solo";

  template.trackControlsContainer.appendChild(template.soloButton);
}

function setupScoreSettingsButton(template: TrackControlsTemplate): void {
  const cssClass = "tu-track-settings-button";
  template.settingsButton.classList.add(cssClass);
  const src = `${assetsPath}/img/ui/settings.svg`;
  template.settingsButton.src = src;
  template.settingsButton.alt = "Track settings";

  template.trackControlsContainer.appendChild(template.settingsButton);
}

/**
 * Responsible for setting up the template of track controls:
 * - Track name
 * - Volume input
 * - Panning input
 */
export function setupTrackControls(
  rootDiv: HTMLDivElement,
  notationView: NotationView,
  template: TrackControlsTemplate,
  track: Tab
): void {
  setupContainer(template);
  setupRemoveButton(template);
  setupTrackName(template, notationView, track);
  setupVolumeInput(template);
  setupPanningInput(template);
  setupMuteButton(template);
  setupSoloButton(template);
  setupScoreSettingsButton(template);

  rootDiv.appendChild(template.trackControlsContainer);
}
