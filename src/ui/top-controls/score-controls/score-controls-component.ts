import { NotationComponent } from "@/notation/notation-component";
import { ScoreControlsTemplate } from "./score-controls-template";
import { ScoreControlsTemplateRenderer } from "./score-controls-template-renderer";
import { TrackControlsTemplate } from "./track-controls";
import { TrackControlsComponent } from "./track-controls/track-controls-component";
import { NewTrackControlsComponent } from "./new-track/new-track-controls-component";
import { Score } from "@/notation";

export class ScoreControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly score: Score;

  readonly template: ScoreControlsTemplate;
  readonly templateRenderer: ScoreControlsTemplateRenderer;

  private _trackComponents: TrackControlsComponent[];
  readonly newTrackComponent: NewTrackControlsComponent;

  private _tracksAreDisplayed: boolean = false;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.score = this.notationComponent.tabController.score;

    this.template = new ScoreControlsTemplate();
    this.templateRenderer = new ScoreControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this._trackComponents = [];

    this.newTrackComponent = new NewTrackControlsComponent(
      this.template.container,
      this.notationComponent
    );
  }

  public changeTracksAreDisplayed(): void {
    this._tracksAreDisplayed = !this._tracksAreDisplayed;
  }

  public render(): void {
    this.templateRenderer.render(this.score);

    this.newTrackComponent.render();

    this._trackComponents = [];
    this.template.tracksContainer.replaceChildren();
    if (!this._tracksAreDisplayed) {
      return;
    }

    for (const track of this.notationComponent.tabController.score.tracks) {
      const trackComponent = new TrackControlsComponent(
        this.template.tracksContainer,
        this.notationComponent,
        track
      );
      trackComponent.render();

      this._trackComponents.push(trackComponent);
    }
  }

  public showNewTrackDialog(): void {
    this.newTrackComponent.template.dialog.showModal();
  }

  public get trackComponents(): TrackControlsComponent[] {
    return this._trackComponents;
  }

  public get tracksAreDisplayed(): boolean {
    return this._tracksAreDisplayed;
  }
}
