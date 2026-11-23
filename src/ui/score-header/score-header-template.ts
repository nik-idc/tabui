import {
  createDiv,
  createInput,
  createSpan,
  createTextArea,
} from "../../shared";

/**
 * Template of the score header at the top of the notation:
 * - Title
 * - Artist
 * - Album and release date
 */
export class ScoreHeaderTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly titleInput: HTMLTextAreaElement = createTextArea();
  readonly artistInput: HTMLTextAreaElement = createTextArea();
  readonly detailsContainer: HTMLDivElement = createDiv();
  readonly albumInput: HTMLTextAreaElement = createTextArea();
  readonly detailsSeparator: HTMLSpanElement = createSpan();
  readonly releaseDateInput: HTMLInputElement = createInput();
}
