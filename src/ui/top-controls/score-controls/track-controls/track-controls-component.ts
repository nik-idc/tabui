import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";
import { TrackControlsTemplateRenderer } from "./track-controls-template-renderer";
import { Track } from "@/notation";
import { YesNoComponent } from "@/ui/shared/yes-no";

export class TrackControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Track;

  readonly template: TrackControlsTemplate;
  readonly templateRenderer: TrackControlsTemplateRenderer;

  readonly yesNoComponent: YesNoComponent;

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

    this.yesNoComponent = new YesNoComponent(
      this.template.container,
      this.notationComponent,
      `Are you sure you want to delete track "${this.track.name}"?`
    );
  }

  public render(): void {
    this.templateRenderer.render();

    this.yesNoComponent.render();
  }

  public showRemoveDialog(): void {
    this.yesNoComponent.template.yesNoDialog.showModal();
  }
}
