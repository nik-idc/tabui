import { NotationComponent } from "@/notation/notation-component";
import {
  TrackControlsDefaultEventHandler,
  TrackControlsEventHandler,
} from "./track-controls-event-handler";
import { TrackControlsTemplate } from "./track-controls-template";
import { TrackControlsTemplateRenderer } from "./track-controls-template-renderer";
import { Tab } from "@/notation";

export class TrackControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Tab;

  readonly template: TrackControlsTemplate;
  readonly templateRenderer: TrackControlsTemplateRenderer;
  readonly eventHandler: TrackControlsEventHandler;

  private _eventsBound: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    track: Tab
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.track = track;

    this.template = new TrackControlsTemplate();
    this.templateRenderer = new TrackControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template,
      this.track
    );
    this.eventHandler = new TrackControlsDefaultEventHandler(this.track);

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.volumeInput.addEventListener("change", () => {
      this.eventHandler.onTrackVolumeChanged(
        this.template,
        this.notationComponent
      );
    });

    this.template.volumeInput.addEventListener("change", () => {
      this.eventHandler.onTrackVolumeChanged(
        this.template,
        this.notationComponent
      );
    });

    this.template.trackButton.addEventListener("click", () => {
      this.eventHandler.onTrackClicked(this.template, this.notationComponent);
    });

    this.template.muteButton.addEventListener("click", () => {
      this.eventHandler.onMuteButtonClicked(
        this.template,
        this.notationComponent
      );
    });

    this.template.soloButton.addEventListener("click", () => {
      this.eventHandler.onSoloButtonClicked(
        this.template,
        this.notationComponent
      );
    });

    this.template.settingsButton.addEventListener("click", () => {
      this.eventHandler.onTrackSettingsClicked(
        this.template,
        this.notationComponent
      );
    });
  }

  public render(): void {
    // 1. Set up template
    this.templateRenderer.render();

    // 2. Bind events
    if (!this._eventsBound) {
      this.bind();
      this._eventsBound = true;
    }
  }
}
