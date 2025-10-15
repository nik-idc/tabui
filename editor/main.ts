import { Tabber } from "../src/tabber";
import { getEl } from "../src/tab-window/editor/misc/utils";
import { score } from "./multi-track-data";

// Get DOM references
const trackSelector = getEl<HTMLSelectElement>("track-selector");
const playButton = getEl<HTMLImageElement>("playButton");
const pauseButton = getEl<HTMLImageElement>("pauseButton");
const stopButton = getEl<HTMLImageElement>("stopButton");
const loopButton = getEl<HTMLImageElement>("loopButton");
const svgRoot = getEl<SVGSVGElement>("svgRoot");
const bendGraphModal = getEl<HTMLDivElement>("bend-graph-modal");
const sideControls = getEl<HTMLDivElement>("side-controls");

const tabber = new Tabber(score, {
  svgRoot,
  bendGraphModal,
  sideControls,
  assetsPath: "assets",
});

// Populate track selector
score.tracks.forEach((track, index) => {
  const option = document.createElement("option");
  option.value = index.toString();
  option.textContent = track.name;
  trackSelector.appendChild(option);
});

// Track selector event listener
trackSelector.addEventListener("change", () => {
  const newTrackIndex = parseInt(trackSelector.value, 10);
  tabber.loadTrack(newTrackIndex);
});

// Player controls
function onPlay(): void {
  tabber.play();
  playButton.style.display = "none";
  pauseButton.style.display = "inline";
}

function onPause(): void {
  tabber.pause();
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
}

function onStop(): void {
  tabber.stop();
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
}

function onLoopClick(): void {
  tabber.setLooped();
  loopButton.setAttribute(
    "class",
    tabber.getIsLooped() ? "loop-icon-active" : "loop-icon"
  );
}

playButton.addEventListener("click", onPlay);
pauseButton.addEventListener("click", onPause);
stopButton.addEventListener("click", onStop);
loopButton.addEventListener("click", onLoopClick);

// Initial load
tabber.loadTrack(0);
