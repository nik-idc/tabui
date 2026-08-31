import { NotationComponent } from "../../notation/notation-component";
import { NoteControlsComponent } from "./note-controls/note-controls-component";
import { SideControlsTemplate } from "./side-controls-template";
import { SideControlsTemplateRenderer } from "./side-controls-template-renderer";
import { TechniqueControlsComponent } from "./technique-controls";
import { MeasureControlsComponent } from "./measure-controls";
import {
  ResolvedTabUIConfig,
  TabUISidePanelPlacement,
} from "../../config/tabui-config";
import { setImageAsset } from "../shared";

export class SideControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: SideControlsTemplate;
  readonly templateRenderer: SideControlsTemplateRenderer;

  readonly noteControlsComponent: NoteControlsComponent;
  readonly techniqueControlsComponent: TechniqueControlsComponent;
  readonly measureControlsComponent: MeasureControlsComponent;
  readonly config: ResolvedTabUIConfig;

  constructor(
    parentDiv: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent,
    config: ResolvedTabUIConfig
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.config = config;

    this.template = new SideControlsTemplate();
    this.templateRenderer = new SideControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );

    this.noteControlsComponent = new NoteControlsComponent(
      this.template.container,
      dialogHost,
      this.notationComponent
    );
    this.techniqueControlsComponent = new TechniqueControlsComponent(
      this.template.container,
      dialogHost,
      this.notationComponent
    );
    this.measureControlsComponent = new MeasureControlsComponent(
      this.template.container,
      dialogHost,
      this.notationComponent
    );
  }

  public renderToggle(collapsed: boolean): void {
    if (
      !this.config.panels.side.visible ||
      !this.config.panels.side.collapsible
    ) {
      return;
    }

    const toggle = this.template.sidePanelToggle;
    if (!toggle.contains(this.template.sidePanelToggleImage)) {
      toggle.appendChild(this.template.sidePanelToggleImage);
    }
    const label = `${collapsed ? "Expand" : "Collapse"} side panel`;
    const isLeft =
      this.config.panels.side.placement === TabUISidePanelPlacement.Left;
    const asset = isLeft === collapsed ? "sm-expand" : "sm-collapse";
    setImageAsset(
      this.template.sidePanelToggleImage,
      this.config.assets,
      `img/ui/${asset}.svg`,
      label
    );
    toggle.type = "button";
    toggle.classList.add("tu-side-controls-toggle");
    toggle.title = label;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-expanded", `${!collapsed}`);
  }

  public render(collapsed?: boolean): void {
    this.templateRenderer.render();
    if (
      this.config.panels.side.visible &&
      this.config.panels.side.collapsible &&
      !this.parentDiv.contains(this.template.sidePanelToggle)
    ) {
      this.parentDiv.insertBefore(
        this.template.sidePanelToggle,
        this.template.container
      );
    }
    if (collapsed !== undefined) {
      this.renderToggle(collapsed);
    }

    this.noteControlsComponent.render();
    this.techniqueControlsComponent.render();
    this.measureControlsComponent.render();
  }
}
