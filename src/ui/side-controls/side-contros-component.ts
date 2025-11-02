import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsComponent } from "./note-controls/note-controls-component";
import { SideControlsTemplate } from "./side-controls-template";
import { SideControlsTemplateRenderer } from "./side-controls-template-renderer";
import { EffectControlsComponent } from "./effect-controls";
import { MeasureControlsComponent } from "./measure-controls";

export class SideControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: SideControlsTemplate;
  readonly templateRenderer: SideControlsTemplateRenderer;

  readonly noteControlsComponent: NoteControlsComponent;
  readonly effectControlsComponent: EffectControlsComponent;
  readonly measureControlsComponent: MeasureControlsComponent;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new SideControlsTemplate();
    this.templateRenderer = new SideControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );

    this.noteControlsComponent = new NoteControlsComponent(
      this.template.sideControlsContainer,
      this.notationComponent
    );
    this.effectControlsComponent = new EffectControlsComponent(
      this.template.sideControlsContainer,
      this.notationComponent
    );
    this.measureControlsComponent = new MeasureControlsComponent(
      this.template.sideControlsContainer,
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
