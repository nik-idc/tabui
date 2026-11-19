import { NotationComponent } from "../../../notation/notation-component";
import { Track } from "../../../notation";
import { ScoreControlsComponent } from "../..";
import { ListenerManager } from "../../../shared/misc";
import {
  TrackControlsCallbacks,
  TrackControlsDefaultCallbacks,
} from "./track-controls/track-controls-callbacks";
import {
  NewTrackControlsCallbacks,
  NewTrackControlsDefaultCallbacks,
} from "./new-track/new-track-controls-callbacks";
import {
  TrackSettingsControlsCallbacks,
  TrackSettingsControlsDefaultCallbacks,
} from "./track-controls/track-settings/track-settings-controls-callbacks";
import {
  YesNoCallbacks,
  YesNoDefaultCallbacks,
} from "../../shared/yes-no/yes-no-callbacks";

export interface ScoreControlsCallbacks {
  onShowTracksButtonClicked(): void;
  onNewTrackButtonClicked(): void;
  onMasterVolumeChanged(): void;
  onMasterPanningChanged(): void;
  onRangeClicked(): void;
  onSelectAllClicked(): void;
  onCopyClicked(): Promise<void>;
  onUndoClicked(): void;
  onRedoClicked(): void;
  onCutClicked(): Promise<void>;
  onPasteClicked(): Promise<void>;
  bind(): void;
  unbind(): void;
}

/** The Clipboard API exists only in secure contexts, such as HTTPS. */
function clipboardAvailable(): boolean {
  return "clipboard" in navigator;
}

/**
 * True when the browser refused access, for example because the user denied
 * it or the host iframe does not allow it. Other errors are bugs and are
 * rethrown.
 */
function isClipboardBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

export class ScoreControlsDefaultCallbacks implements ScoreControlsCallbacks {
  private _scoreComponent: ScoreControlsComponent;
  private _notationComponent: NotationComponent;
  private _renderFunc: () => void;
  private _showTrackSettings: (track: Track) => void;

  private _trackCallbacks: TrackControlsCallbacks[] = [];
  private _newTrackCallbacks: NewTrackControlsCallbacks;
  private _trackSettingsCallbacks: TrackSettingsControlsCallbacks;
  private _trackRemoveCallbacks: YesNoCallbacks;

  private _listeners = new ListenerManager();
  private _bound = false;

  constructor(
    scoreComponent: ScoreControlsComponent,
    notationComponent: NotationComponent,
    renderFunc: () => void,
    showTrackSettings: (track: Track) => void
  ) {
    this._scoreComponent = scoreComponent;
    this._notationComponent = notationComponent;
    this._renderFunc = renderFunc;
    this._showTrackSettings = showTrackSettings;

    this._newTrackCallbacks = new NewTrackControlsDefaultCallbacks(
      this._scoreComponent.newTrackComponent,
      this._notationComponent,
      this._renderFunc
    );
    this._trackSettingsCallbacks = new TrackSettingsControlsDefaultCallbacks(
      this._scoreComponent.trackSettingsComponent,
      this._notationComponent,
      this._renderFunc
    );
    this._trackRemoveCallbacks = new YesNoDefaultCallbacks(
      this._scoreComponent.trackRemoveComponent,
      this._notationComponent,
      this._renderFunc,
      () => this._scoreComponent.removeSelectedTrack()
    );
  }

  onShowTracksButtonClicked(): void {
    this._scoreComponent.changeTracksAreDisplayed();
    this._scoreComponent.render();

    if (this._scoreComponent.tracksAreDisplayed) {
      this.bindTracksCallbacks();
    }
  }

  onNewTrackButtonClicked(): void {
    const controller = this._notationComponent.trackController;
    if (!controller.canEdit) {
      return;
    }
    this._scoreComponent.showNewTrackDialog();
  }

  onMasterVolumeChanged(): void {
    this._notationComponent.trackController.setMasterVolume(
      this._scoreComponent.score,
      Number(this._scoreComponent.template.masterVolumeInput.value) / 100
    );
  }

  onMasterPanningChanged(): void {
    this._notationComponent.trackController.setMasterPan(
      this._scoreComponent.score,
      Number(this._scoreComponent.template.masterPanningInput.value)
    );
  }

  onRangeClicked(): void {
    const controller = this._notationComponent.trackController;
    if (controller.hasSelectionAnchor) {
      controller.clearSelectionRange();
    } else {
      controller.setSelectionAnchor();
    }
    this._renderFunc();
  }

  onSelectAllClicked(): void {
    if (this._notationComponent.trackController.selectAllBeats()) {
      this._renderFunc();
    }
  }

  /**
   * The clipboard buttons use the browser's Clipboard API, which the browser
   * can block. Ctrl+C, Ctrl+X, and Ctrl+V use clipboard events instead, which
   * always work.
   */
  async onCopyClicked(): Promise<void> {
    const text = this._notationComponent.trackController.copy();
    if (text !== undefined && !(await this.writeClipboard(text))) {
      this.announceClipboardBlocked("Ctrl+C");
    }
  }

  onUndoClicked(): void {
    this._notationComponent.trackController.undo();
    this._renderFunc();
  }

  onRedoClicked(): void {
    this._notationComponent.trackController.redo();
    this._renderFunc();
  }

  async onCutClicked(): Promise<void> {
    const controller = this._notationComponent.trackController;
    if (!controller.canEdit) {
      return;
    }
    const text = controller.copy();
    if (text === undefined) {
      return;
    }
    // Remove the beats only once they are on the clipboard.
    if (!(await this.writeClipboard(text))) {
      this.announceClipboardBlocked("Ctrl+X");
      return;
    }
    controller.removeSelectedBeat();
    this._renderFunc();
  }

  async onPasteClicked(): Promise<void> {
    const text = await this.readClipboard();
    if (text === undefined) {
      this.announceClipboardBlocked("Ctrl+V");
      return;
    }
    if (this._notationComponent.trackController.paste(text)) {
      this._renderFunc();
    }
  }

  /** Returns false when the browser blocks the write. */
  private async writeClipboard(text: string): Promise<boolean> {
    if (!clipboardAvailable()) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      if (isClipboardBlocked(error)) {
        return false;
      }
      throw error;
    }
  }

  /** Returns undefined when the browser blocks the read. */
  private async readClipboard(): Promise<string | undefined> {
    if (!clipboardAvailable()) {
      return undefined;
    }
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      if (isClipboardBlocked(error)) {
        return undefined;
      }
      throw error;
    }
  }

  // Screen readers only for now. Visible messages are planned in ROADMAP.md.
  private announceClipboardBlocked(shortcut: string): void {
    this._scoreComponent.announce(
      `The browser blocked clipboard access. Use ${shortcut}.`
    );
  }

  private bindTracksCallbacks(): void {
    for (const trackCallbacks of this._trackCallbacks) {
      trackCallbacks.unbind();
    }

    this._trackCallbacks = [];
    for (const trackComponent of this._scoreComponent.trackComponents) {
      const callbacks = new TrackControlsDefaultCallbacks(
        trackComponent,
        this._notationComponent,
        this._renderFunc,
        () => this._showTrackSettings(trackComponent.track),
        () => this._scoreComponent.showTrackRemoveDialog(trackComponent.track)
      );
      callbacks.bind();

      this._trackCallbacks.push(callbacks);
    }
  }

  bind(): void {
    if (this._bound) {
      return;
    }

    this._listeners.bindAll([
      {
        element: this._scoreComponent.template.showTracksButton,
        event: "click",
        handler: () => this.onShowTracksButtonClicked(),
      },
      {
        element: this._scoreComponent.template.newTrackButton,
        event: "click",
        handler: () => this.onNewTrackButtonClicked(),
      },
      {
        element: this._scoreComponent.template.masterVolumeInput,
        event: "input",
        handler: () => this.onMasterVolumeChanged(),
      },
      {
        element: this._scoreComponent.template.masterPanningInput,
        event: "input",
        handler: () => this.onMasterPanningChanged(),
      },
      {
        element: this._scoreComponent.template.rangeButton,
        event: "click",
        handler: () => this.onRangeClicked(),
      },
      {
        element: this._scoreComponent.template.selectAllButton,
        event: "click",
        handler: () => this.onSelectAllClicked(),
      },
      {
        element: this._scoreComponent.template.copyButton,
        event: "click",
        handler: () => void this.onCopyClicked(),
      },
      {
        element: this._scoreComponent.template.undoButton,
        event: "click",
        handler: () => this.onUndoClicked(),
      },
      {
        element: this._scoreComponent.template.redoButton,
        event: "click",
        handler: () => this.onRedoClicked(),
      },
      {
        element: this._scoreComponent.template.cutButton,
        event: "click",
        handler: () => void this.onCutClicked(),
      },
      {
        element: this._scoreComponent.template.pasteButton,
        event: "click",
        handler: () => void this.onPasteClicked(),
      },
    ]);

    this.bindTracksCallbacks();

    this._newTrackCallbacks.bind();
    this._trackSettingsCallbacks.bind();
    this._trackRemoveCallbacks.bind();
    this._bound = true;
  }

  unbind(): void {
    if (!this._bound) {
      return;
    }

    this._listeners.unbindAll();
    for (const trackCallbacks of this._trackCallbacks) {
      trackCallbacks.unbind();
    }
    this._newTrackCallbacks.unbind();
    this._trackSettingsCallbacks.unbind();
    this._trackRemoveCallbacks.unbind();
    this._trackCallbacks = [];
    this._bound = false;
  }
}
