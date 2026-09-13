import { createDiv } from "../../shared";

export class EditorShellTemplate {
  private static _nextEditorId = 1;

  readonly announcementHost: HTMLDivElement = createDiv();
  readonly skipLink: HTMLAnchorElement = document.createElement("a");
  readonly scorePanelHost: HTMLDivElement = createDiv();
  readonly sidePanelHost: HTMLDivElement = createDiv();
  readonly notationViewport: HTMLDivElement = createDiv();
  readonly responsiveMessage: HTMLDivElement = createDiv();
  readonly dialogHost: HTMLDivElement = createDiv();

  /** Creates an editor-local notation target. */
  constructor() {
    this.notationViewport.id = `tu-notation-viewport-${EditorShellTemplate._nextEditorId++}`;
  }
}
