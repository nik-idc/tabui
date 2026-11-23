import { DialogEnforcer } from "../../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../../notation/notation-component";
import { NoteControlsTemplate } from "./note-controls-template";
import { NoteControlsTemplateRenderer } from "./note-controls-template-renderer";
import { TupletControlsComponent } from "./tuplet-controls";
import { FretControlsComponent } from "./fret-controls";
import { formatActiveDynamic } from "../../../notation/accessibility/notation-selection-announcement";

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
    private readonly _announce: (text: string) => void
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
      this._announce
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

  /**
   * Speaks the active beat's dynamic after a dynamic edit. Navigation text names
   * a dynamic only where it changes, so an edit needs its own confirmation.
   */
  public announceDynamic(): void {
    const text = formatActiveDynamic(this.notationComponent.trackController);
    if (text !== undefined) {
      this._announce(text);
    }
  }

  public showTupletControls(): void {
    this.tupletComponent.render();
    this.tupletComponent.dialog.showModal();
  }
}
