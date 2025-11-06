import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsTemplate } from "./note-controls-template";
import { NoteControlsTemplateRenderer } from "./note-controls-template-renderer";

export class NoteControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NoteControlsTemplate;
  readonly templateRenderer: NoteControlsTemplateRenderer;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new NoteControlsTemplate();
    this.templateRenderer = new NoteControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
