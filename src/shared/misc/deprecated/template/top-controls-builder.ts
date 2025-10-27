import { Score } from "@/notation";
import { createDiv, createImage, createLabel, createSelect } from "@/shared";

type TopControlsEventTypes = "track" | "play" | "pause" | "stop" | "loop";

/**
 * Class responsible for building the top controls:
 * - Track selector
 * - Play controls
 */
export class TopControlsTemplateBuilder {
  private _rootDiv: HTMLDivElement;

  private _trackSelectorContainer: HTMLDivElement;
  private _trackSelectorLabel: HTMLLabelElement;
  private _trackSelector: HTMLSelectElement;
  private _playControlsContainer: HTMLDivElement;
  private _playButton: HTMLImageElement;
  private _pauseButton: HTMLImageElement;
  private _stopButton: HTMLImageElement;
  private _loopButton: HTMLImageElement;

  private _listeners: {
    [listenerType in TopControlsEventTypes]: undefined | (() => void);
  } = {
    track: undefined,
    play: undefined,
    pause: undefined,
    stop: undefined,
    loop: undefined,
  };

  constructor(rootDiv: HTMLDivElement) {
    this._rootDiv = rootDiv;

    this._trackSelectorContainer = createDiv();
    this._trackSelectorLabel = createLabel();
    this._trackSelector = createSelect();
    this._playControlsContainer = createDiv();
    this._playButton = createImage();
    this._pauseButton = createImage();
    this._stopButton = createImage();
    this._loopButton = createImage();
  }

  private buildTrackSelector(): void {
    this._trackSelectorContainer = createDiv();
    this._trackSelectorContainer.setAttribute(
      "id",
      "tu-track-selector-container"
    );
    this._trackSelectorContainer.setAttribute(
      "class",
      "tu-track-selector-container"
    );

    this._trackSelector.setAttribute("id", "tu-track-selector");
    this._trackSelectorContainer.appendChild(this._trackSelector);

    this._trackSelectorLabel.setAttribute("for", "tu-track-selector");
    this._trackSelectorContainer.appendChild(this._trackSelectorLabel);

    this._rootDiv.appendChild(this._trackSelector);
  }

  private buildPlayControls(): void {
    this._playControlsContainer.setAttribute("id", "play-controls-container");
    this._playControlsContainer.setAttribute(
      "class",
      "play-controls-container"
    );

    this._playButton.setAttribute("id", "playButton");
    this._playButton.setAttribute("src", "/img/ui/play.svg");
    this._playButton.setAttribute("alt", "Play");
    this._playControlsContainer.appendChild(this._playButton);

    this._pauseButton.setAttribute("id", "pauseButton");
    this._pauseButton.setAttribute("src", "/img/ui/pause.svg");
    this._pauseButton.setAttribute("alt", "Pause");
    this._pauseButton.setAttribute("style", "display: none");
    this._playControlsContainer.appendChild(this._pauseButton);

    this._stopButton.setAttribute("id", "stopButton");
    this._stopButton.setAttribute("src", "/img/ui/stop.svg");
    this._stopButton.setAttribute("alt", "Stop");
    this._playControlsContainer.appendChild(this._stopButton);

    this._loopButton.setAttribute("id", "loopButton");
    this._loopButton.setAttribute("src", "/img/ui/loop.svg");
    this._loopButton.setAttribute("alt", "Loop");
    this._loopButton.setAttribute("class", "loop-icon");
    this._playControlsContainer.appendChild(this._loopButton);

    this._rootDiv.appendChild(this._playControlsContainer);
  }

  public build(): void {
    // Clear everything
    this._rootDiv.replaceChildren();

    this.buildTrackSelector();
    this.buildPlayControls();
  }

  public setupTrackSelector(score: Score): void {
    const options = [];
    for (let i = 0; i < score.tracks.length; i++) {
      const option = document.createElement("option");
      option.value = i.toString();
      option.textContent = score.tracks[i].name;

      options.push(option);
    }
    this._trackSelector.replaceChildren(...options);
  }

  public attachEventListener(
    controlName: TopControlsEventTypes,
    listener: () => void
  ): void {
    switch (controlName) {
      case "track":
        this._trackSelector.addEventListener("change", listener);
        break;
      case "play":
        this._playButton.addEventListener("click", listener);
        break;
      case "pause":
        this._pauseButton.addEventListener("click", listener);
        break;
      case "stop":
        this._stopButton.addEventListener("click", listener);
        break;
      case "loop":
        this._loopButton.addEventListener("click", listener);
        break;
      default:
        throw new Error(`Unknown control name: ${controlName}`);
    }

    this._listeners[controlName] = listener;
  }

  public destroy(): void {
    if (this._listeners["track"] !== undefined) {
      this._trackSelector.removeEventListener(
        "change",
        this._listeners["track"]
      );
    }
    if (this._listeners["play"] !== undefined) {
      this._playButton.removeEventListener("click", this._listeners["play"]);
    }
    if (this._listeners["pause"] !== undefined) {
      this._pauseButton.removeEventListener("click", this._listeners["pause"]);
    }
    if (this._listeners["stop"] !== undefined) {
      this._stopButton.removeEventListener("click", this._listeners["stop"]);
    }
    if (this._listeners["loop"] !== undefined) {
      this._loopButton.removeEventListener("click", this._listeners["loop"]);
    }

    this._rootDiv.replaceChildren();
  }
}
