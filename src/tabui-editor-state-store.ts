import { NotationComponent } from "./notation/notation-component";
import { EditorLayoutDimensions } from "./notation/controller/editor-layout-dimensions";
import { PlaybackError } from "./player";
import { TrackEvent } from "./shared/events";
import {
  TabUIEditorEvent,
  TabUIEditorListener,
  TabUIEditorStateSnapshot,
} from "./tabui-editor-state";

type TabUIEditorEventArgs = {
  event: TabUIEditorEvent;
};

export class TabUIEditorStateStore {
  private _snapshot?: TabUIEditorStateSnapshot;
  private readonly _events = new TrackEvent<TabUIEditorEventArgs>();

  private createSnapshot(
    notationComponent: NotationComponent,
    layoutDimensions: EditorLayoutDimensions
  ): TabUIEditorStateSnapshot {
    const controller = notationComponent.trackController;
    const selectionCursor = controller.selectionCursor;
    const cursor =
      selectionCursor === undefined
        ? null
        : {
            beat: selectionCursor.beat,
            note: selectionCursor.note,
            noteIndex: selectionCursor.noteIndex,
          };

    return {
      activeTrack: controller.track,
      playback: {
        state: controller.playbackState,
        isLooped: controller.isLooped,
      },
      selection: {
        activeVoiceNumber: controller.activeVoiceNumber,
        beats: [...controller.selectionBeats],
        cursor,
      },
      layout: {
        width: layoutDimensions.WIDTH,
        height: controller.windowHeight,
      },
    };
  }

  public initialize(
    notationComponent: NotationComponent,
    layoutDimensions: EditorLayoutDimensions
  ): void {
    this._snapshot = this.createSnapshot(notationComponent, layoutDimensions);
  }

  public emitChange(
    notationComponent: NotationComponent,
    layoutDimensions: EditorLayoutDimensions
  ): void {
    this._snapshot = this.createSnapshot(notationComponent, layoutDimensions);
    this._events.emit("event", {
      type: "change",
      state: this._snapshot,
    });
  }

  public emitPlaybackError(error: PlaybackError): void {
    this._events.emit("event", {
      type: "error",
      error: { source: "playback", ...error },
    });
  }

  public subscribe(listener: TabUIEditorListener): () => void {
    return this._events.on("event", listener);
  }

  public getState(): TabUIEditorStateSnapshot {
    if (this._snapshot === undefined) {
      throw new Error("TabUIEditor initialized without owned components");
    }
    return this._snapshot;
  }

  public clear(): void {
    this._snapshot = undefined;
    this._events.clear();
  }
}
