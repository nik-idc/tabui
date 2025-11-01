import { NoteDuration, TabController } from "@/notation";
import { ScoreControlsEventHandler } from "./score-controls-event-handler";
import { NotationView } from "@/notation/notation-view";
import { ScoreControlsTemplate } from "./score-controls-template";

export class ScoreControlsDefaultEventHandler
  implements ScoreControlsEventHandler
{
  onMasterVolumeChanged(
    template: ScoreControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }

  onMasterPanningChanged(
    template: ScoreControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }

  onScoreSettingsClicked(
    template: ScoreControlsTemplate,
    notationView: NotationView
  ): void {
    throw new Error("Method not implemented");
  }
}
