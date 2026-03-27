import { createButton, createDiv } from "@/shared";
import { PlayControlsTemplate } from "./play-controls";
import { ScoreControlsTemplate } from "./score-controls";

/**
 * Interface defining the template of top controls:
 * - Score/track controls
 * - Play controls
 */
export class TopControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
}
