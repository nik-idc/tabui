import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";
import { TrackControlsTemplateRenderer } from "./track-controls-template-renderer";
import { Tab } from "@/notation";

export class TrackControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Tab;

  readonly template: TrackControlsTemplate;
  readonly templateRenderer: TrackControlsTemplateRenderer;

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
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
