import { createDiv } from "../../shared";

export class EditorShellTemplate {
  readonly scorePanelHost: HTMLDivElement = createDiv();
  readonly sidePanelHost: HTMLDivElement = createDiv();
  readonly notationViewport: HTMLDivElement = createDiv();
  readonly responsiveMessage: HTMLDivElement = createDiv();
  readonly dialogHost: HTMLDivElement = createDiv();
}
