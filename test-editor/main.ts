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
} from "../src/index";
import { createBasicTabWindow, fillTestTab } from "./data";
import { data2TabWindow } from "./data2";

// Utility: Get element or throw
function getEl<T extends Element>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw Error(`Missing HTML element: ${id}`);
  }
  return el as unknown as T;
}

// Get DOM references
const playButton = getEl<HTMLButtonElement>("playButton");
const stopButton = getEl<HTMLButtonElement>("stopButton");
const startOverButton = getEl<HTMLButtonElement>("startOverButton");
const jumpToSecondBeatButton = getEl<HTMLButtonElement>(
  "jumpToSecondBeatButton"
);
const editorContainer = getEl<HTMLDivElement>("mainEditorContainer");
const credentialsContainer = getEl<HTMLDivElement>("credentialsContainer");
const svgContainer = getEl<HTMLDivElement>("svgContainer");
const svgRoot = document.getElementById("svgRoot") as SVGSVGElement | null;
if (svgRoot === null) {
  throw Error("Error getting SVG root element");
}

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

const binder = new TabWindowCallbackBinder(
  svgRenderer,
  new TabWindowMouseDefCallbacks(svgRenderer, renderAndBind),
  new TabWindowKeyboardDefCallbacks(svgRenderer, renderAndBind)
);

function renderAndBind(
  newRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
): void {
  binder.bind(newRenderers);
}

renderAndBind(svgRenderer.render());

// // Setup player cursor
// const playerAnimator = new TabPlayerSVGAnimator(data2TabWindow);
// playerAnimator.bindToBeatChanged();

// Handlers
function onPlay(): void {
  data2TabWindow.startPlayer();
  renderAndBind(svgRenderer.render());
}

function onStop(): void {
  data2TabWindow.stopPlayer();
  renderAndBind(svgRenderer.render());
}

function onStartOver(): void {
  data2TabWindow.stopPlayer();
  data2TabWindow.selectNoteElementUsingIds(0, 0, 0, 0);
  data2TabWindow.startPlayer();
  renderAndBind(svgRenderer.render());
}

function onJumpToSecondBeat(): void {
  data2TabWindow.selectNoteElementUsingIds(0, 0, 1, 0);
  renderAndBind(svgRenderer.render());
}

// Bind events
playButton.addEventListener("click", onPlay);
stopButton.addEventListener("click", onStop);
startOverButton.addEventListener("click", onStartOver);
jumpToSecondBeatButton.addEventListener("click", onJumpToSecondBeat);
