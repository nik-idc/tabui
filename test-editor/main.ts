import { tabEvent, TabEventType } from "../src/events/tab-event";
import {
  TabWindowRenderer,
  TabWindowHTMLRenderer,
  TabPlayerSVGAnimator,
  BeatElement,
} from "../src/index";
import { createBasicTabWindow, fillTestTab } from "./data";

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

// Initialize and prepare tab window
const tabWindow = createBasicTabWindow();
fillTestTab(tabWindow);
tabWindow.selectNoteElementUsingIds(0, 0, 0, 0);

// Render
const htmlRenderer = new TabWindowHTMLRenderer(
  tabWindow,
  "assets",
  editorContainer
);
htmlRenderer.render();

// Setup player cursor
const playerCursor = getEl<SVGRectElement>("playerCursor");
const playerAnimator = new TabPlayerSVGAnimator(playerCursor, tabWindow);
playerAnimator.bindToBeatChanged();

// Handlers
function onPlay(): void {
  tabWindow.startPlayer();
}

function onStop(): void {
  tabWindow.stopPlayer();
}

function onStartOver(): void {
  tabWindow.stopPlayer();
  tabWindow.selectNoteElementUsingIds(0, 0, 0, 0);
  tabWindow.startPlayer();
}

function onJumpToSecondBeat(): void {
  tabWindow.selectNoteElementUsingIds(0, 0, 1, 0);
}

function onBeatClicked(beatElement: BeatElement): void {
  console.log(`On beat clicked: ${beatElement.beat.uuid}`);

  const notes = beatElement.beatNotesElement.noteElements;
  tabWindow.selectNoteElement(notes[0]);
}

function bindOnClickedToBeats(): void {
  const lines = tabWindow.getTabLineElements();
  for (const line of lines) {
    for (const bar of line.barElements) {
      for (const beat of bar.beatElements) {
        const beatGroup = document.getElementById(
          `beat-${beat.beat.uuid}`
        ) as SVGGElement | null;

        if (beatGroup === null) {
          continue;
        }

        beatGroup.addEventListener("click", (ev: MouseEvent) => {
          onBeatClicked(beat);
        });
      }
    }
  }
}

// Bind events
playButton.addEventListener("click", onPlay);
stopButton.addEventListener("click", onStop);
startOverButton.addEventListener("click", onStartOver);
jumpToSecondBeatButton.addEventListener("click", onJumpToSecondBeat);

bindOnClickedToBeats();
