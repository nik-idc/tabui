import { createButton, createDiv, createImage } from "../../shared";

/**
 * Interface defining the template of side controls:
 * - Note controls
 * - Technique controls
 * - Measure controls
 */
export class SideControlsTemplate {
  readonly container: HTMLDivElement = createDiv();
  readonly sidePanelToggle: HTMLButtonElement = createButton();
  readonly sidePanelToggleImage: HTMLImageElement = createImage();
}
