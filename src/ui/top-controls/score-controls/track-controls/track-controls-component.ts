import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";
import { TrackControlsTemplateRenderer } from "./track-controls-template-renderer";
import { Tab } from "@/notation";
import { YesNoComponent } from "@/ui/shared/yes-no";

export class TrackControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Tab;

  readonly template: TrackControlsTemplate;
  readonly templateRenderer: TrackControlsTemplateRenderer;

  readonly yesNoComponent: YesNoComponent;

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

    this.yesNoComponent = new YesNoComponent(
      this.rootDiv,
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
