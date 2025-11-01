import { NotationView } from "@/notation/notation-view";
import { ScoreControlsTemplate } from "./score-controls-template";

export interface ScoreControlsEventHandler {
  onMasterVolumeChanged(
    template: ScoreControlsTemplate,
    notationView: NotationView
  ): void;
  onMasterPanningChanged(
    template: ScoreControlsTemplate,
    notationView: NotationView
  ): void;
  onScoreSettingsClicked(
    template: ScoreControlsTemplate,
    notationView: NotationView
  ): void;
}
