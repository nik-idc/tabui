import { DialogEnforcer } from "../../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../../notation/notation-component";
import { NoteControlsComponent } from "./note-controls/note-controls-component";
import { SideControlsTemplate } from "./side-controls-template";
import { SideControlsTemplateRenderer } from "./side-controls-template-renderer";
import { TechniqueControlsComponent } from "./technique-controls";
import { MeasureControlsComponent } from "./measure-controls";
import { ResolvedTabUIConfig } from "../../config/tabui-config";

export class SideControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: SideControlsTemplate;
  readonly templateRenderer: SideControlsTemplateRenderer;

  readonly noteControlsComponent: NoteControlsComponent;
  readonly techniqueControlsComponent: TechniqueControlsComponent;
  readonly measureControlsComponent: MeasureControlsComponent;

  constructor(
    parentDiv: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    config: ResolvedTabUIConfig,
    announce: (text: string) => void
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new SideControlsTemplate();
    this.templateRenderer = new SideControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template,
      config
    );

    this.noteControlsComponent = new NoteControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent,
      announce
    );
    this.techniqueControlsComponent = new TechniqueControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent,
      announce
    );
    this.measureControlsComponent = new MeasureControlsComponent(
      this.template.container,
      dialogEnforcer,
      this.notationComponent,
      announce
    );
  }

  public renderToggle(collapsed: boolean): void {
    this.templateRenderer.renderToggle(collapsed);
  }

  public render(collapsed?: boolean): void {
    this.templateRenderer.render(collapsed);

    this.noteControlsComponent.render();
    this.techniqueControlsComponent.render();
    this.measureControlsComponent.render();
  }
}
