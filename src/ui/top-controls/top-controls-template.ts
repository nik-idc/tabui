import { PlayControlsTemplate } from "./play-controls";
import { ScoreControlsTemplate } from "./score-controls";

/**
 * Interface defining the template of top controls:
 * - Score/track controls
 * - Play controls
 */
export interface TopControlsTemplate {
  readonly topControlsContainer: HTMLDivElement;

  readonly showTracksButton: HTMLButtonElement;

  readonly scoreControlsTemplate: ScoreControlsTemplate;
  readonly playControlsTemplate: PlayControlsTemplate;
}
