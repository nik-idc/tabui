import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsComponent } from "./note-controls/note-controls-component";
import { SideControlsTemplate } from "./side-controls-template";
import { SideControlsTemplateRenderer } from "./side-controls-template-renderer";
import { EffectControlsComponent } from "./effect-controls";
import { MeasureControlsComponent } from "./measure-controls";

export class SideControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: SideControlsTemplate;
  readonly templateRenderer: SideControlsTemplateRenderer;

  readonly noteControlsComponent: NoteControlsComponent;
  readonly effectControlsComponent: EffectControlsComponent;
  readonly measureControlsComponent: MeasureControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new SideControlsTemplate();
    this.templateRenderer = new SideControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this.noteControlsComponent = new NoteControlsComponent(
      this.template.container,
      this.notationComponent
    );
    this.effectControlsComponent = new EffectControlsComponent(
      this.template.container,
      this.notationComponent
    );
    this.measureControlsComponent = new MeasureControlsComponent(
      this.template.container,
      this.notationComponent
    );
  }

  public render(): void {
    this.templateRenderer.render();

    this.noteControlsComponent.render();
    this.effectControlsComponent.render();
    this.measureControlsComponent.render();
  }
}
