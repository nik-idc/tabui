import { NotationComponent } from "@/notation/notation-component";
import { ScoreControlsTemplate } from "./score-controls-template";
import { ScoreControlsTemplateRenderer } from "./score-controls-template-renderer";
import { TrackControlsTemplate } from "./track-controls";
import { TrackControlsComponent } from "./track-controls/track-controls-component";

export class ScoreControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: ScoreControlsTemplate;
  readonly templateRenderer: ScoreControlsTemplateRenderer;

  private _trackComponents: TrackControlsComponent[];

  private _tracksAreDisplayed: boolean = false;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new ScoreControlsTemplate();
    this.templateRenderer = new ScoreControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );

    this._trackComponents = [];
  }

  public changeTracksAreDisplayed(): void {
    this._tracksAreDisplayed = !this._tracksAreDisplayed;
  }

  public render(): void {
    this.templateRenderer.render();

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

  public get trackComponents(): TrackControlsComponent[] {
    return this._trackComponents;
  }

  public get tracksAreDisplayed(): boolean {
    return this._tracksAreDisplayed;
  }
}
