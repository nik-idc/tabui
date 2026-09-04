import { NotationComponent } from "../../notation/notation-component";
import { SideControlsTemplate } from "./side-controls-template";
import { renderOnce } from "../shared";
import {
  ResolvedTabUIConfig,
  TabUISidePanelPlacement,
} from "../../config/tabui-config";
import { resolveAssetUrl } from "../../config/asset-url-resolver";

export class SideControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: SideControlsTemplate;
  readonly config: ResolvedTabUIConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: SideControlsTemplate,
    config: ResolvedTabUIConfig
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.config = config;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-side-controls";
    this.template.container.classList.add(cssClass);

    this.parentDiv.appendChild(this.template.container);
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
    this.template.sidePanelToggleImage.src = resolveAssetUrl(
      this.config.assets,
      `img/ui/${asset}.svg`
    );
    this.template.sidePanelToggleImage.alt = "";
    toggle.type = "button";
    toggle.classList.add("tu-side-controls-toggle");
    toggle.title = label;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-expanded", `${!collapsed}`);
  }

  public render(collapsed?: boolean): void {
    const controller = this.notationComponent.trackController;
    const editingDisabled =
      !controller.editingEnabled || controller.isPlaybackActive;
    this.template.container.inert = editingDisabled;
    this.template.container.classList.toggle(
      "tu-editing-disabled",
      editingDisabled
    );
    this.template.container.setAttribute("aria-disabled", `${editingDisabled}`);
    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
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
  }
}
