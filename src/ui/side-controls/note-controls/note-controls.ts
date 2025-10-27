import { createDiv, createImage } from "@/shared";
import { NoteControlsTemplate } from "./note-controls-template";
import { setupNoteControls } from "./note-controls-template-setup";
import { NoteControlsDefaultEventHandler } from "./note-controls-def-event-handler";
import { bindNoteControlsEvents } from "./note-controls-event-binder";
import { NotationView } from "@/notation/notation-view";

export function initNoteControls(
  notationView: NotationView,
  template: NoteControlsTemplate
): void {
  setupNoteControls(notationView.rootDiv, template);

  const defEventHandlers = new NoteControlsDefaultEventHandler();
  bindNoteControlsEvents(notationView, template, defEventHandlers);
}
