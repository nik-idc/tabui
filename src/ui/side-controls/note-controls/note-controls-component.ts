import { DialogEnforcer } from "../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../notation/notation-component";
import { NoteControlsTemplate } from "./note-controls-template";
import { NoteControlsTemplateRenderer } from "./note-controls-template-renderer";
import { TupletControlsComponent } from "./tuplet-controls";
import { FretControlsComponent } from "./fret-controls";

export class NoteControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NoteControlsTemplate;
  readonly templateRenderer: NoteControlsTemplateRenderer;

  readonly tupletComponent: TupletControlsComponent;
  readonly fretComponent: FretControlsComponent;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    announce: (text: string) => void
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new NoteControlsTemplate();
    this.templateRenderer = new NoteControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this.tupletComponent = new TupletControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent,
      announce
    );
    this.fretComponent = new FretControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();

    this.tupletComponent.render();
    this.fretComponent.render();
  }

  public showTupletControls(): void {
    this.tupletComponent.render();
    this.tupletComponent.dialog.showModal();
  }
}
