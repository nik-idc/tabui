import { MeasureControlsTemplate } from "./measure-controls-template";
import { MeasureControlsEventHandler } from "./measure-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export function bindMeasureControlsEvents(
  notationView: NotationView,
  template: MeasureControlsTemplate,
  eventHandlers: MeasureControlsEventHandler
): void {
  template.tempoButton.addEventListener("click", () =>
    eventHandlers.onTempoClicked(notationView)
  );
  template.timeSignatureButton.addEventListener("click", () =>
    eventHandlers.onTimeSignatureClicked(notationView)
  );
  template.repeatStartButton.addEventListener("click", () =>
    eventHandlers.onRepeatStartClicked(notationView)
  );
  template.repeatEndButton.addEventListener("click", () =>
    eventHandlers.onRepeatEndClicked(notationView)
  );
}
