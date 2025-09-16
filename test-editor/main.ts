import { tabEvent, TabEventType } from "../src/events/tab-event";
import {
  TabWindowRenderer,
  TabWindowHTMLRenderer,
  TabPlayerSVGAnimator,
  BeatElement,
  TabWindowSVGRenderer,
  TabWindowCallbackBinder,
  TabWindowMouseDefCallbacks,
  TabWindowKeyboardCallbacks,
  TabWindowKeyboardDefCallbacks,
  SVGBarRenderer,
  SVGBeatRenderer,
  SVGNoteRenderer,
  NoteDuration,
  GuitarEffectType,
  GuitarEffectOptions,
} from "../src/index";
import { BendSelectorManager } from "../src/tab-window/render/bend-selectors/bend-selector-manager";
import { createBasicTabWindow, fillTestTab } from "./data";
import { data2TabWindow } from "./data2";
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
const playButton = getEl<HTMLImageElement>("playButton");
const pauseButton = getEl<HTMLImageElement>("pauseButton");
const stopButton = getEl<HTMLImageElement>("stopButton");
const editorContainer = getEl<HTMLDivElement>("mainEditorContainer");
const credentialsContainer = getEl<HTMLDivElement>("credentialsContainer");
const svgContainer = getEl<HTMLDivElement>("svgContainer");
const svgRoot = document.getElementById("svgRoot") as SVGSVGElement | null;
if (svgRoot === null) {
  throw Error("Error getting SVG root element");
}
const bendGraphModal = getEl<HTMLDivElement>("bend-graph-modal");
const sideControls = getEl<HTMLDivElement>("side-controls");

// Initialize and prepare tab window
// const tabWindow = createBasicTabWindow();
// fillTestTab(data2TabWindow);
data2TabWindow.selectNoteElementUsingIds(0, 0, 0, 0);
let tabWindowHeight = 0;
const tabLineElements = data2TabWindow.getTabLineElements();
for (const tabLineElement of tabLineElements) {
  tabWindowHeight += tabLineElement.rect.height;
}

// Set SVG root properties
const svgRootVB = `0 0 ${data2TabWindow.dim.width} ${tabWindowHeight}`;
const svgRootWidth = `${data2TabWindow.dim.width}`;
const svgRootHeight = `${tabWindowHeight}`;
svgRoot.setAttribute("viewBox", svgRootVB);
svgRoot.setAttribute("width", svgRootWidth);
svgRoot.setAttribute("height", svgRootHeight);

const svgRenderer = new TabWindowSVGRenderer(data2TabWindow, "assets", svgRoot);
const bendSelectorManager = new BendSelectorManager(bendGraphModal);

const binder = new TabWindowCallbackBinder(
  svgRenderer,
  new TabWindowMouseDefCallbacks(svgRenderer, renderAndBind),
  new TabWindowKeyboardDefCallbacks(
    svgRenderer,
    renderAndBind,
    bendSelectorManager
  )
);

function renderAndBind(
  newRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
): void {
  binder.bind(newRenderers);
}

renderAndBind(svgRenderer.render());

const editPanel = new EditPanel(
  data2TabWindow,
  sideControls,
  () => renderAndBind(svgRenderer.render()),
  bendSelectorManager
);
editPanel.bind();

// // Setup player cursor
// const playerAnimator = new TabPlayerSVGAnimator(data2TabWindow);
// playerAnimator.bindToBeatChanged();

// Handlers
function onPlay(): void {
  data2TabWindow.startPlayer();
  playButton.style.display = "none";
  pauseButton.style.display = "inline";
  renderAndBind(svgRenderer.render());
}

function onPause(): void {
  data2TabWindow.stopPlayer();
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
  renderAndBind(svgRenderer.render());
}

function onStop(): void {
  data2TabWindow.stopPlayer();
  playButton.style.display = "inline";
  pauseButton.style.display = "none";
  renderAndBind(svgRenderer.render());
}

// Bind events
playButton.addEventListener("click", onPlay);
pauseButton.addEventListener("click", onPause);
stopButton.addEventListener("click", onStop);
