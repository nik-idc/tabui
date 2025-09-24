import {
  TabWindow,
  TabWindowDim,
  TabWindowSVGRenderer,
  TabWindowCallbackBinder,
  TabWindowMouseDefCallbacks,
  TabWindowKeyboardDefCallbacks,
  SVGBarRenderer,
  SVGBeatRenderer,
  SVGNoteRenderer,
} from "../src/index";
import { BendSelectorManager } from "../src/tab-window/render/bend-selectors/bend-selector-manager";
import { score } from "./multi-track-data";
import { EditPanel } from "./panels/edit-panel";

// Utility: Get element or throw
function getEl<T extends Element>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw Error(`Missing HTML element: ${id}`);
  }
  return el as unknown as T;
}

// Get DOM references
const trackSelector = getEl<HTMLSelectElement>("track-selector");
const playButton = getEl<HTMLImageElement>("playButton");
const pauseButton = getEl<HTMLImageElement>("pauseButton");
const stopButton = getEl<HTMLImageElement>("stopButton");
const svgRoot = getEl<SVGSVGElement>("svgRoot");
const bendGraphModal = getEl<HTMLDivElement>("bend-graph-modal");
const sideControls = getEl<HTMLDivElement>("side-controls");

let currentTrackIndex = 0;
let tabWindow: TabWindow;
let svgRenderer: TabWindowSVGRenderer;
let binder: TabWindowCallbackBinder;
let editPanel: EditPanel;
let bendSelectorManager: BendSelectorManager;

function renderAndBind(
  activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
): void {
  if (binder) {
    binder.bind(activeRenderers);
  }
}

function init(trackIndex: number) {
  currentTrackIndex = trackIndex;
  const tab = score.tracks[currentTrackIndex];

  // Create TabWindow
  const dim = new TabWindowDim(
    1200, // width
    14, // noteTextSize
    42, // timeSigTextSize
    28, // tempoTextSize
    50, // durationsHeight
    tab.guitar.stringsCount
  );
  tabWindow = new TabWindow(score, tab, dim);
  // tabWindow.calcTabElement();
  tabWindow.selectNoteElementUsingIds(0, 0, 0, 0);

  // Set SVG root properties
  let tabWindowHeight = 0;
  const tabLineElements = tabWindow.getTabLineElements();
  for (const tabLineElement of tabLineElements) {
    tabWindowHeight += tabLineElement.rect.height;
  }
  const svgRootVB = `0 0 ${tabWindow.dim.width} ${tabWindowHeight}`;
  svgRoot.setAttribute("viewBox", svgRootVB);
  svgRoot.setAttribute("width", `${tabWindow.dim.width}`);
  svgRoot.setAttribute("height", `${tabWindowHeight}`);

  // Unrender what's been already rendered
  if (svgRenderer !== undefined) {
    svgRenderer.unrender();
  }

  // Create renderers and binders
  svgRenderer = new TabWindowSVGRenderer(tabWindow, "assets", svgRoot);
  bendSelectorManager = new BendSelectorManager(bendGraphModal);

  binder = new TabWindowCallbackBinder(
    svgRenderer,
    new TabWindowMouseDefCallbacks(svgRenderer, () =>
      renderAndBind(svgRenderer.render())
    ),
    new TabWindowKeyboardDefCallbacks(
      svgRenderer,
      () => renderAndBind(svgRenderer.render()),
      bendSelectorManager
    )
  );

  renderAndBind(svgRenderer.render());

  // Create edit panel
  editPanel = new EditPanel(
    tabWindow,
    sideControls,
    () => renderAndBind(svgRenderer.render()),
    bendSelectorManager
  );
  editPanel.bind();
}

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
  init(newTrackIndex);
});

// Player controls
function onPlay(): void {
  tabWindow.startPlayer();
  playButton.style.display = "none";
  pauseButton.style.display = "inline";
}

function onPause(): void {
  tabWindow.stopPlayer();
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
}

function onStop(): void {
  tabWindow.stopPlayer();
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
}

playButton.addEventListener("click", onPlay);
pauseButton.addEventListener("click", onPause);
stopButton.addEventListener("click", onStop);

// Initial load
init(0);
