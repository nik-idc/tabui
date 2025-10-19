import { BeatElement } from "../../elements/beat-element";
import { NoteElement } from "../../elements/note-element";

export abstract class TabWindowMouseCallbacks {
  public abstract onNoteClick(
    event: MouseEvent,
    noteElement: NoteElement
  ): void;

  public abstract onNoteMouseEnter(
    event: MouseEvent,
    noteElement: NoteElement
  ): void;

  public abstract onNoteMouseLeave(
    event: MouseEvent,
    noteElement: NoteElement
  ): void;

  public abstract onBeatMouseDown(
    event: MouseEvent,
    beatElement: BeatElement
  ): void;

  public abstract onBeatMouseEnter(
    event: MouseEvent,
    beatElement: BeatElement
  ): void;

  public abstract onBeatMouseMove(
    event: MouseEvent,
    beatElement: BeatElement
  ): void;

  public abstract onBeatMouseUp(): void;

  public abstract onWindowMouseUp(): void;
}
