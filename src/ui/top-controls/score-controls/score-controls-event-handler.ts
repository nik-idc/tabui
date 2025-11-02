import { NotationComponent } from "@/notation/notation-component";
import { ScoreControlsTemplate } from "./score-controls-template";

export interface ScoreControlsEventHandler {
  onShowTracksButtonClicked(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent,
    renderTracks: (displayTracks: boolean) => void
  ): void;
  onMasterVolumeChanged(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onMasterPanningChanged(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent
  ): void;
  onScoreSettingsClicked(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent
  ): void;
}

export class ScoreControlsDefaultEventHandler
  implements ScoreControlsEventHandler
{
  private _displayTracks: boolean = false;

  onShowTracksButtonClicked(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent,
    renderTracks: (displayTracks: boolean) => void
  ): void {
    this._displayTracks = !this._displayTracks;
    renderTracks(this._displayTracks);
  }

  onMasterVolumeChanged(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onMasterPanningChanged(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }

  onScoreSettingsClicked(
    template: ScoreControlsTemplate,
    notationComponent: NotationComponent
  ): void {
    throw new Error("Method not implemented");
  }
}
