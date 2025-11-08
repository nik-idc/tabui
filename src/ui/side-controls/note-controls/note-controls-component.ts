import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsTemplate } from "./note-controls-template";
import { NoteControlsTemplateRenderer } from "./note-controls-template-renderer";
import { TupletControlsComponent } from "./tuplet-controls";

export class NoteControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NoteControlsTemplate;
  readonly templateRenderer: NoteControlsTemplateRenderer;

  readonly tupletComponent: TupletControlsComponent;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new NoteControlsTemplate();
    this.templateRenderer = new NoteControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );

    this.tupletComponent = new TupletControlsComponent(
      this.rootDiv,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();

    this.tupletComponent.render();
  }

  public showTupletControls(): void {
    this.tupletComponent.template.tupletDialog.showModal();
  }
}
