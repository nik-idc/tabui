import { NotationComponent } from "@/notation/notation-component";
import { ScoreControlsDefaultEventHandler } from "./score-controls-event-handler";
import { ScoreControlsEventHandler } from "./score-controls-event-handler";
import { ScoreControlsTemplate } from "./score-controls-template";
import { ScoreControlsTemplateRenderer } from "./score-controls-template-renderer";
import { TrackControlsTemplate } from "./track-controls";
import { TrackControlsComponent } from "./track-controls/track-controlts-component";

export class ScoreControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: ScoreControlsTemplate;
  readonly templateRenderer: ScoreControlsTemplateRenderer;
  readonly eventHandler: ScoreControlsEventHandler;

  private _trackComponents: TrackControlsComponent[];
  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new ScoreControlsTemplate();
    this.templateRenderer = new ScoreControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new ScoreControlsDefaultEventHandler();

    this._trackComponents = [];
    this._eventsBound = false;
  }

  private renderTracks(displayTracks: boolean): void {
    if (displayTracks) {
      this._trackComponents = [];
      for (const track of this.notationComponent.tabController.score.tracks) {
        const trackComponent = new TrackControlsComponent(
          this.rootDiv,
          this.notationComponent,
          track
        );
        trackComponent.render();

        this._trackComponents.push(trackComponent);
      }
      this.template.tracksContainer.append(
        ...this._trackComponents.map((t) => t.template.trackControlsContainer)
      );
    } else {
      this.template.tracksContainer.replaceChildren();
    }
  }

  public bind(): void {
    this.template.showTracksButton.addEventListener("click", () => {
      this.eventHandler.onShowTracksButtonClicked(
        this.template,
        this.notationComponent,
        this.renderTracks.bind(this)
      );
    });

    this.template.masterVolumeInput.addEventListener("change", () => {
      this.eventHandler.onMasterVolumeChanged(this.template, this.notationComponent);
    });

    this.template.masterPanningInput.addEventListener("change", () => {
      this.eventHandler.onMasterPanningChanged(
        this.template,
        this.notationComponent
      );
    });

    this.template.scoreSettingsButton.addEventListener("click", () => {
      this.eventHandler.onScoreSettingsClicked(
        this.template,
        this.notationComponent
      );
    });
  }

  public render(): void {
    this.templateRenderer.render();

    if (!this._eventsBound) {
      this.bind();
      this._eventsBound = true;
    }
  }
}
