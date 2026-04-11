import { getEl } from "@/shared/misc/get-dom-element";
import { TabUIEditor } from "@/tabui-editor";
import { EditorLayoutDimensions } from "@/notation";
import { resolveEditorFixture } from "./data/fixture";

EditorLayoutDimensions.configure({
  width: 1200,
  noteTextSize: 12,
  timeSigTextSize: 48,
  tempoTextSize: 24,
  durationsHeight: 30,
});

const rootDiv = document.getElementById(
  "tabui-editor"
) as HTMLDivElement | null;
if (rootDiv === null) {
  throw new Error("Could not get root div element");
}
const searchParams = new URLSearchParams(window.location.search);
const selectedFixture = searchParams.get("fixture");
const selectedScore = resolveEditorFixture(searchParams);
if (selectedFixture === "selection_perf") {
  console.log("=== PERF MODE ===", "Selection stress score enabled");
}

const tabuiEditor = new TabUIEditor(rootDiv, selectedScore);
tabuiEditor.init();

// Get DOM references
// const trackSelector = getEl<HTMLSelectElement>("track-selector");
// const playButton = getEl<HTMLImageElement>("playButton");
// const pauseButton = getEl<HTMLImageElement>("pauseButton");
// const stopButton = getEl<HTMLImageElement>("stopButton");
// const loopButton = getEl<HTMLImageElement>("loopButton");
// const svgRoot = getEl<SVGSVGElement>("svgRoot");
// const bendGraphModal = getEl<HTMLDivElement>("bend-graph-modal");
// const sideControls = getEl<HTMLDivElement>("side-controls");

// const base = import.meta.env.BASE_URL;
// const tabui = new Editor(score, {
//   svgRoot,
//   bendGraphModal,
//   sideControls,
//   assetsPath: base,
// });

// // Populate track selector
// score.tracks.forEach((track, index) => {
//   const option = document.createElement("option");
//   option.value = index.toString();
//   option.textContent = track.name;
//   trackSelector.appendChild(option);
// });

// // Track selector event listener
// trackSelector.addEventListener("change", () => {
//   const newTrackIndex = parseInt(trackSelector.value, 10);
//   tabui.loadTrack(newTrackIndex);
// });

// // Player controls
// function onPlay(): void {
//   tabui.play();
//   playButton.style.display = "none";
//   pauseButton.style.display = "inline";
// }

// function onPause(): void {
//   tabui.pause();
//   playButton.style.display = "inline";
//   pauseButton.style.display = "none";
// }

// function onStop(): void {
//   tabui.stop();
//   playButton.style.display = "inline";
//   pauseButton.style.display = "none";
// }

// function onLoopClick(): void {
//   tabui.setLooped();
//   loopButton.setAttribute(
//     "class",
//     tabui.getIsLooped() ? "loop-icon-active" : "loop-icon"
//   );
// }

// playButton.addEventListener("click", onPlay);
// pauseButton.addEventListener("click", onPause);
// stopButton.addEventListener("click", onStop);
// loopButton.addEventListener("click", onLoopClick);

// // Initial load
// tabui.loadTrack(0);
