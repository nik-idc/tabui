
import { NoteDuration } from "@/notation";
import { NotationView } from "@/notation/notation-view";

export interface NoteControlsEventHandler {
  onDurationClicked(
    noteDuration: NoteDuration,
    notationView: NotationView
  ): void;
  onDotClicked(dots: number, notationView: NotationView): void;
  onTupletNormalClicked(normalCount: number, notationView: NotationView): void;
  onTupletClicked(notationView: NotationView): void;
}
