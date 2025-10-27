import { NoteElement, BeatElement, TabController } from "@/notation/element";
import { EditorRenderer } from "../editor-renderer";
import { ElementRenderer } from "../element-renderer";

export interface EditorMouseCallbacks {
  readonly renderer: EditorRenderer;
  readonly controller: TabController;
  readonly bindAfterRender: (activeRenderers: ElementRenderer[]) => void;

  onNoteClick(event: MouseEvent, noteElement: NoteElement): void;

  onNoteMouseEnter(event: MouseEvent, noteElement: NoteElement): void;

  onNoteMouseLeave(event: MouseEvent, noteElement: NoteElement): void;

  onBeatMouseDown(event: MouseEvent, beatElement: BeatElement): void;

  onBeatMouseEnter(event: MouseEvent, beatElement: BeatElement): void;

  onBeatMouseMove(event: MouseEvent, beatElement: BeatElement): void;

  onBeatMouseUp(): void;

  onWindowMouseUp(): void;
}
