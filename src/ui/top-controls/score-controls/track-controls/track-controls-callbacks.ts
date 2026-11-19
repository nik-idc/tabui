import { NotationComponent } from "../../../../notation/notation-component";
import { TrackControlsComponent } from "../../..";
import { ListenerManager } from "../../../../shared/misc";

export interface TrackControlsCallbacks {
  onTrackRemoveClicked(): void;
  onTrackSelected(): void;
  onTrackMoveUpClicked(): void;
  onTrackMoveDownClicked(): void;
  onTrackNameChanged(): void;
  onTrackVolumeChanged(event: InputEvent): void;
  onTrackPanningChanged(event: InputEvent): void;
  onMuteButtonClicked(): void;
  onSoloButtonClicked(): void;
  onTrackSettingsClicked(): void;
  bind(): void;
  unbind(): void;
}

export class TrackControlsDefaultCallbacks implements TrackControlsCallbacks {
  private _trackComponent: TrackControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _showTrackSettings: () => void;
  private _showTrackRemove: () => void;

  private _listeners = new ListenerManager();
  private _bound = false;

  constructor(
    trackComponent: TrackControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    showTrackSettings: () => void,
    showTrackRemove: () => void
  ) {
    this._trackComponent = trackComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._showTrackSettings = showTrackSettings;
    this._showTrackRemove = showTrackRemove;
  }

  onTrackRemoveClicked(): void {
    const controller = this._notationComponent.trackController;
    if (!controller.canRemoveTrack(this._notationComponent.score)) {
      return;
    }
    this._showTrackRemove();
  }

  /** Loads the track and keeps keyboard focus on its row. */
  onTrackSelected(): void {
    this.selectTrack();
    this._trackComponent.template.container.focus();
  }

  private selectTrack(): void {
    this._notationComponent.loadTrack(this._trackComponent.track);
    this._renderFunc();
  }

  private onTrackRowClicked(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const interactive = target.closest(
      `button, input, select, textarea, a, [contenteditable='true']` +
        `, .tu-track-volume-controls, .tu-track-panning-controls`
    );
    if (
      interactive &&
      interactive !== this._trackComponent.template.container
    ) {
      return;
    }
    // A mouse click leaves focus to the editor, which returns it to notation.
    this.selectTrack();
  }

  private onTrackRowKeyDown(event: KeyboardEvent): void {
    if (event.target !== this._trackComponent.template.container) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    this.onTrackSelected();
  }

  onTrackMoveUpClicked(): void {
    this.moveTrack(-1);
  }

  onTrackMoveDownClicked(): void {
    this.moveTrack(1);
  }

  private moveTrack(offset: number): void {
    const track = this._trackComponent.track;
    const trackIndex = this._notationComponent.score.tracks.indexOf(track);
    const targetIndex = trackIndex + offset;
    if (this._notationComponent.trackController.moveTrack(track, targetIndex)) {
      this._renderFunc();
    }
  }

  onTrackNameChanged(): void {
    const changed = this._notationComponent.trackController.setTrackName(
      this._trackComponent.track,
      this._trackComponent.template.trackNameInput.value
    );
    if (changed) {
      this._renderFunc();
    }
  }

  onTrackVolumeChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._notationComponent.trackController.setTrackVolume(
      this._trackComponent.track,
      Number(input.value) / 100
    );
  }

  onTrackPanningChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._notationComponent.trackController.setTrackPan(
      this._trackComponent.track,
      Number(input.value)
    );
  }

  onMuteButtonClicked(): void {
    if (
      this._notationComponent.trackController.toggleTrackMuted(
        this._trackComponent.track
      )
    ) {
      this._renderFunc();
    }
  }

  onSoloButtonClicked(): void {
    if (
      this._notationComponent.trackController.toggleTrackSoloed(
        this._trackComponent.track
      )
    ) {
      this._renderFunc();
    }
  }

  onTrackSettingsClicked(): void {
    const controller = this._notationComponent.trackController;
    if (!controller.canEdit) {
      return;
    }
    this._showTrackSettings();
  }

  bind(): void {
    if (this._bound) {
      return;
    }

    this._listeners.bindAll([
      {
        element: this._trackComponent.template.removeButton,
        event: "click",
        handler: () => this.onTrackRemoveClicked(),
      },
      {
        element: this._trackComponent.template.container,
        event: "click",
        handler: (event: Event) => this.onTrackRowClicked(event),
      },
      {
        element: this._trackComponent.template.container,
        event: "keydown",
        handler: (event: Event) =>
          this.onTrackRowKeyDown(event as KeyboardEvent),
      },
      {
        element: this._trackComponent.template.moveUpButton,
        event: "click",
        handler: () => this.onTrackMoveUpClicked(),
      },
      {
        element: this._trackComponent.template.moveDownButton,
        event: "click",
        handler: () => this.onTrackMoveDownClicked(),
      },
      {
        element: this._trackComponent.template.trackNameInput,
        event: "input",
        handler: () => this.onTrackNameChanged(),
      },
      {
        element: this._trackComponent.template.volumeInput,
        event: "input",
        handler: (event: Event) => {
          this.onTrackVolumeChanged(event);
        },
      },
      {
        element: this._trackComponent.template.panningInput,
        event: "input",
        handler: (event: Event) => {
          this.onTrackPanningChanged(event);
        },
      },
      {
        element: this._trackComponent.template.muteButton,
        event: "click",
        handler: () => this.onMuteButtonClicked(),
      },
      {
        element: this._trackComponent.template.soloButton,
        event: "click",
        handler: () => this.onSoloButtonClicked(),
      },
      {
        element: this._trackComponent.template.settingsButton,
        event: "click",
        handler: () => this.onTrackSettingsClicked(),
      },
    ]);

    this._bound = true;
  }

  unbind(): void {
    if (!this._bound) {
      return;
    }

    this._listeners.unbindAll();
    this._bound = false;
  }
}
