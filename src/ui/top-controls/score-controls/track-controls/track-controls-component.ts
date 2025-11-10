import { NotationComponent } from "@/notation/notation-component";
import { TrackControlsTemplate } from "./track-controls-template";
import { TrackControlsTemplateRenderer } from "./track-controls-template-renderer";
import { Tab } from "@/notation";
import { YesNoComponent } from "@/ui/shared/yes-no";
import { TrackSettingsControlsComponent } from "./track-settings";

export class TrackControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly track: Tab;

  readonly template: TrackControlsTemplate;
  readonly templateRenderer: TrackControlsTemplateRenderer;

  readonly yesNoComponent: YesNoComponent;
  readonly trackSettingsComponent: TrackSettingsControlsComponent;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    track: Tab
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
    this.trackSettingsComponent = new TrackSettingsControlsComponent(
      this.template.container,
      this.notationComponent,
      this.track
    );
  }

  public render(): void {
    this.templateRenderer.render();

    this.yesNoComponent.render();
    this.trackSettingsComponent.render();
  }

  public showRemoveDialog(): void {
    this.yesNoComponent.template.yesNoDialog.showModal();
  }

  public showTrackSettings(): void {
    this.trackSettingsComponent.template.dialog.showModal();
  }
}
