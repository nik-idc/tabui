
import { TopControlsTemplate } from "./top-controls-template";
import { TopControlsEventHandler } from "./top-controls-event-handler";
import { NotationView } from "@/notation/notation-view";

export function bindTopControlsEvents(
  notationView: NotationView,
  template: TopControlsTemplate,
  eventHandlers: TopControlsEventHandler
): void {
  template.trackSelector.addEventListener("change", () =>
    eventHandlers.onTrackChanged(
      parseInt(template.trackSelector.value, 10),
      notationView
    )
  );
  template.playButton.addEventListener("click", () =>
    eventHandlers.onPlayClicked(notationView)
  );
  template.pauseButton.addEventListener("click", () =>
    eventHandlers.onPauseClicked(notationView)
  );
  template.stopButton.addEventListener("click", () =>
    eventHandlers.onStopClicked(notationView)
  );
  template.loopButton.addEventListener("click", () =>
    eventHandlers.onLoopClicked(notationView)
  );
}
