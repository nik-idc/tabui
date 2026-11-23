import { NotationComponent } from "../../../notation/notation-component";
import {
  labelGroup,
  renderOnce,
  setImageAsset,
  setShortcutTooltip,
} from "../../shared";
import { StaffControlsTemplate } from "./staff-controls-template";
import type { ResolvedAssetConfig } from "../../../assets";

export class StaffControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: StaffControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled = false;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: StaffControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;
  }

  private assembleContainer(): void {
    this.template.container.classList.add("tu-staff-controls");
    labelGroup(this.template.container, "Staff");
    this.template.container.append(
      this.template.addStaffButton,
      this.template.removeStaffButton
    );
    this.parentDiv.appendChild(this.template.container);
  }

  private renderButton(
    button: HTMLButtonElement,
    assetPath: string,
    label: string,
    shortcut: string,
    enabled: boolean
  ): void {
    setImageAsset(button, this.assetsPath, assetPath, label);
    setShortcutTooltip(button, label, shortcut);
    button.disabled = !enabled;
    button.classList.toggle("tu-disabled-img", !enabled);
  }

  public render(): void {
    const trackController = this.notationComponent.trackController;
    this.renderButton(
      this.template.addStaffButton,
      "img/ui/staff-add.svg",
      "Add staff below",
      "Alt+N",
      trackController.canAddStaff
    );
    this.renderButton(
      this.template.removeStaffButton,
      "img/ui/staff-remove.svg",
      "Remove staff",
      "Alt+Delete",
      trackController.canRemoveStaff
    );

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
