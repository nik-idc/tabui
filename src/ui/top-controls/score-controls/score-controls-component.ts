import { NotationComponent } from "../../../notation/notation-component";
import { ScoreControlsTemplate } from "./score-controls-template";
import { ScoreControlsTemplateRenderer } from "./score-controls-template-renderer";
import { TrackControlsComponent } from "./track-controls/track-controls-component";
import { NewTrackControlsComponent } from "./new-track/new-track-controls-component";
import { Score, Track } from "../../../notation";
import { TrackSettingsControlsComponent } from "./track-controls/track-settings";
import { YesNoComponent } from "../../shared/yes-no";

export class ScoreControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly score: Score;

  readonly template: ScoreControlsTemplate;
  readonly templateRenderer: ScoreControlsTemplateRenderer;

  private _trackComponents: TrackControlsComponent[];
  readonly newTrackComponent: NewTrackControlsComponent;
  readonly trackSettingsComponent: TrackSettingsControlsComponent;
  readonly trackRemoveComponent: YesNoComponent;
  private _trackToRemove: Track | null = null;

  private _tracksAreDisplayed: boolean = false;

  constructor(
    parentDiv: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.score = this.notationComponent.score;

    this.template = new ScoreControlsTemplate();
    this.templateRenderer = new ScoreControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this._trackComponents = [];

    this.newTrackComponent = new NewTrackControlsComponent(
      this.template.container,
      dialogHost,
      this.notationComponent
    );
    this.trackSettingsComponent = new TrackSettingsControlsComponent(
      this.template.container,
      dialogHost,
      this.notationComponent,
      this.score.tracks[0]
    );
    this.trackRemoveComponent = new YesNoComponent(
      this.template.container,
      dialogHost,
      this.notationComponent
    );
  }

  public changeTracksAreDisplayed(): void {
    this._tracksAreDisplayed = !this._tracksAreDisplayed;
  }

  public render(): void {
    this.templateRenderer.render(this.score);

    this.newTrackComponent.render();
    this.trackSettingsComponent.render();
    this.trackRemoveComponent.render();
    const controller = this.notationComponent.trackController;
    const editingDisabled =
      !controller.editingEnabled || controller.isPlaybackActive;
    const editingDialogs = [
      this.newTrackComponent.template.dialog,
      this.trackSettingsComponent.template.dialog,
      this.trackRemoveComponent.template.yesNoDialog,
    ];
    for (const dialog of editingDialogs) {
      dialog.inert = editingDisabled;
      dialog.classList.toggle("tu-editing-disabled", editingDisabled);
      dialog.setAttribute("aria-disabled", `${editingDisabled}`);
    }

    this.reconcileTrackComponents();
  }

  private reconcileTrackComponents(): void {
    if (!this._tracksAreDisplayed) {
      this.template.tracksContainer.replaceChildren();
      this._trackComponents = [];
      return;
    }

    const remainingTrackComponents = new Map(
      this._trackComponents.map((tc) => [tc.track, tc])
    );
    const nextTrackComponents: TrackControlsComponent[] = [];

    for (const track of this.notationComponent.score.tracks) {
      const trackComponent =
        remainingTrackComponents.get(track) ??
        new TrackControlsComponent(
          this.template.tracksContainer,
          this.notationComponent,
          track
        );

      trackComponent.render();

      const container = trackComponent.template.container;
      const nextContainerIndex = nextTrackComponents.length;
      const currentContainer =
        this.template.tracksContainer.children[nextContainerIndex];
      if (currentContainer !== container) {
        this.template.tracksContainer.insertBefore(
          container,
          currentContainer ?? null
        );
      }
      remainingTrackComponents.delete(track);

      nextTrackComponents.push(trackComponent);
    }

    for (const trackComponent of remainingTrackComponents.values()) {
      trackComponent.template.container.remove();
    }

    this._trackComponents = nextTrackComponents;
  }

  public showNewTrackDialog(): void {
    const controller = this.notationComponent.trackController;
    if (controller.isPlaybackActive) {
      return;
    }
    this.newTrackComponent.template.dialog.showModal();
  }

  public showTrackSettingsDialog(track: Track): void {
    const controller = this.notationComponent.trackController;
    if (controller.isPlaybackActive) {
      return;
    }
    this.trackSettingsComponent.setTrack(track);
    this.trackSettingsComponent.render();
    this.trackSettingsComponent.template.dialog.showModal();
  }

  public showTrackRemoveDialog(track: Track): void {
    const controller = this.notationComponent.trackController;
    if (controller.isPlaybackActive) {
      return;
    }
    this._trackToRemove = track;
    this.trackRemoveComponent.setText(
      `Are you sure you want to delete track "${track.name}"?`
    );
    this.trackRemoveComponent.template.yesNoDialog.showModal();
  }

  public removeSelectedTrack(): void {
    if (
      this.notationComponent.trackController.isPlaybackActive ||
      this._trackToRemove === null
    ) {
      return;
    }

    this.notationComponent.removeTrack(this._trackToRemove);
    this._trackToRemove = null;
  }

  public get trackComponents(): TrackControlsComponent[] {
    return this._trackComponents;
  }

  public get tracksAreDisplayed(): boolean {
    return this._tracksAreDisplayed;
  }
}
