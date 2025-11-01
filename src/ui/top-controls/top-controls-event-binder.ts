import { NotationView } from "@/notation/notation-view";
import { TopControlsEventHandler } from "./top-controls-event-handler";
import { TopControlsTemplate } from "./top-controls-template";

export function bindTopControlsEvents(
  notationView: NotationView,
  template: TopControlsTemplate,
  eventHandlers: TopControlsEventHandler
): void {
  template.showTracksButton.addEventListener("click", () => {
    eventHandlers.onShowButtonClicked(template, notationView);
  });
}
