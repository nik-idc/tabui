import { NotationView } from "@/notation/notation-view";
import { TopControlsTemplate } from "./top-controls-template";
import { createOption } from "@/shared";

const assetsPath = import.meta.env.BASE_URL;
const buttonSize = `30px`;

function setupTopControlsContainer(template: TopControlsTemplate): void {
  const cssClass = "tu-top-controls";
  template.topControlsContainer.classList.add(cssClass);
}

function setupTrackControls(
  template: TopControlsTemplate,
  notationView: NotationView
): void {
  const containerCSSClass = "tu-track-controls";
  template.trackSelectorContainer.classList.add(containerCSSClass);

  template.trackSelector.setAttribute("id", "tu-track-selector");
  const tracks = notationView.tabController.score.tracks;
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const option = createOption();
    option.text = track.name;
    option.value = `${i}`;
    template.trackSelector.add(option);
  }
  template.trackSelector.value = template.trackSelector.options[0].value;
  const trackSelectorCSSClass = "tu-track-selector";
  template.trackSelector.classList.add(trackSelectorCSSClass);
  // Remove the visible label and add a "New" button next to the selector
  template.trackSelectorLabel.setAttribute("for", "tu-track-selector");

  template.newTrackButton.setAttribute("id", "tu-new-track");
  template.newTrackButton.textContent = "New";
  template.newTrackButton.classList.add("tu-new-track-button");

  template.trackSelectorContainer.append(
    template.newTrackButton,
    template.trackSelector
  );
  template.topControlsContainer.appendChild(template.trackSelectorContainer);
}

function setupPlayButtons(template: TopControlsTemplate): void {
  const cssClass = "tu-play-controls";
  template.playControlsContainer.setAttribute("class", cssClass);

  template.playButton.setAttribute("src", `${assetsPath}/img/ui/play.svg`);
  template.playButton.setAttribute("alt", "Play");
  template.playButton.setAttribute("width", buttonSize);
  template.playButton.setAttribute("height", buttonSize);

  template.pauseButton.setAttribute("src", `${assetsPath}/img/ui/pause.svg`);
  template.pauseButton.setAttribute("alt", "Pause");
  template.pauseButton.setAttribute("style", "display: none");
  template.pauseButton.setAttribute("width", buttonSize);
  template.pauseButton.setAttribute("height", buttonSize);

  template.stopButton.setAttribute("src", `${assetsPath}/img/ui/stop.svg`);
  template.stopButton.setAttribute("alt", "Stop");
  template.stopButton.setAttribute("width", buttonSize);
  template.playButton.setAttribute("height", buttonSize);

  template.loopButton.setAttribute("src", `${assetsPath}/img/ui/loop.svg`);
  template.loopButton.setAttribute("alt", "Loop");
  template.loopButton.setAttribute("class", "loop-icon");
  template.loopButton.setAttribute("width", buttonSize);
  template.loopButton.setAttribute("height", buttonSize);

  template.playControlsContainer.append(
    template.playButton,
    template.pauseButton,
    template.stopButton,
    template.loopButton
  );
  template.topControlsContainer.appendChild(template.playControlsContainer);
}

/**
 * Responsible for setting up the template of top controls:
 * - Tempo change
 * - Time signature change
 * - Repeat start/end
 */
export function setupTopControls(
  rootDiv: HTMLDivElement,
  notationView: NotationView,
  template: TopControlsTemplate
): void {
  setupTopControlsContainer(template);
  setupTrackControls(template, notationView);
  setupPlayButtons(template);

  rootDiv.appendChild(template.topControlsContainer);
}
