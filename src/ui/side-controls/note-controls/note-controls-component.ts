import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsTemplate } from "./note-controls-template";
import { NoteControlsTemplateRenderer } from "./note-controls-template-renderer";
import { TupletControlsComponent } from "./tuplet-controls";

export class NoteControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NoteControlsTemplate;
  readonly templateRenderer: NoteControlsTemplateRenderer;

  readonly tupletComponent: TupletControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new NoteControlsTemplate();
    this.templateRenderer = new NoteControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this.tupletComponent = new TupletControlsComponent(
      this.parentDiv,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();

    this.tupletComponent.render();
  }

  public showTupletControls(): void {
    this.tupletComponent.template.dialog.showModal();
  }
}
