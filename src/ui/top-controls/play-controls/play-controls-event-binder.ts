import { NotationView } from "@/notation/notation-view";
import { PlayControlsEventHandler } from "./play-controls-event-handler";
import { PlayControlsTemplate } from "./play-controls-template";

export function bindPlayControlsEvents(
  notationView: NotationView,
  template: PlayControlsTemplate,
  eventHandlers: PlayControlsEventHandler
): void {
  template.firstButton.addEventListener("click", () =>
    eventHandlers.onFirstClicked(notationView, template)
  );
  template.prevButton.addEventListener("click", () =>
    eventHandlers.onPrevClicked(notationView, template)
  );
  template.playButton.addEventListener("click", () =>
    eventHandlers.onPlayClicked(notationView, template)
  );
  template.nextButton.addEventListener("click", () =>
    eventHandlers.onNextClicked(notationView, template)
  );
  template.lastButton.addEventListener("click", () =>
    eventHandlers.onLastClicked(notationView, template)
  );
  template.loopButton.addEventListener("click", () =>
    eventHandlers.onLoopClicked(notationView, template)
  );
}
