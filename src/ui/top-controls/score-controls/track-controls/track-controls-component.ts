import { NotationComponent } from "../../../../notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";
import { TrackControlsTemplateRenderer } from "./track-controls-template-renderer";
import { Track } from "../../../../notation";

export class TrackControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Track;

  readonly template: TrackControlsTemplate;
  readonly templateRenderer: TrackControlsTemplateRenderer;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    track: Track
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.track = track;

    this.template = new TrackControlsTemplate();
    this.templateRenderer = new TrackControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template,
      this.track
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
