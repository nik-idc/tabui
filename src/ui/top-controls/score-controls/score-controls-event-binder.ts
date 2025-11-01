import { NotationView } from "@/notation/notation-view";
import { ScoreControlsEventHandler } from "./score-controls-event-handler";
import { ScoreControlsTemplate } from "./score-controls-template";

export function bindScoreControlsEvents(
  notationView: NotationView,
  template: ScoreControlsTemplate,
  eventHandlers: ScoreControlsEventHandler
): void {
  template.masterVolumeInput.addEventListener("change", () => {
    eventHandlers.onMasterVolumeChanged(template, notationView);
  });

  template.masterPanningInput.addEventListener("change", () => {
    eventHandlers.onMasterPanningChanged(template, notationView);
  });

  template.scoreSettingsButton.addEventListener("click", () => {
    eventHandlers.onScoreSettingsClicked(template, notationView);
  });
}
