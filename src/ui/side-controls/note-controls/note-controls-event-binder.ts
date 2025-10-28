
import { NoteControlsEventHandler } from "./note-controls-event-handler";
import { NoteControlsTemplate } from "./note-controls-template";
import { NotationView } from "@/notation/notation-view";

export function bindNoteControlsEvents(
  notationView: NotationView,
  template: NoteControlsTemplate,
  eventHandlers: NoteControlsEventHandler
): void {
  for (const durationButton of template.noteDurationButtons) {
    const duration = 1 / Number(durationButton.dataset["duration"]);
    durationButton.addEventListener("click", () =>
      eventHandlers.onDurationClicked(duration, notationView)
    );
  }

  template.dot1Button.addEventListener("click", () =>
    eventHandlers.onDotClicked(1, notationView)
  );
  template.dot2Button.addEventListener("click", () =>
    eventHandlers.onDotClicked(2, notationView)
  );

  template.tuplet2Button.addEventListener("click", () =>
    eventHandlers.onTupletNormalClicked(2, notationView)
  );
  template.tuplet3Button.addEventListener("click", () =>
    eventHandlers.onTupletNormalClicked(3, notationView)
  );
  template.tupletButton.addEventListener("click", () =>
    eventHandlers.onTupletClicked(notationView)
  );
}
