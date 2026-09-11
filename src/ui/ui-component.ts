import { DialogEnforcer } from "../shared/hmtl/dialog-enforcer";
import { NotationComponent } from "../notation/notation-component";
import { ResolvedTabUIConfig } from "../config/tabui-config";
import { SideControlsComponent } from "./side-controls/side-controls-component";
import { TopControlsComponent } from "./top-controls";

export class UIComponent {
  readonly topHost: HTMLDivElement;
  readonly sideHost: HTMLDivElement;
  readonly dialogEnforcer: DialogEnforcer;
  readonly notationComponent: NotationComponent;
  readonly config: ResolvedTabUIConfig;

  readonly topComponent: TopControlsComponent;
  readonly sideComponent: SideControlsComponent;

  constructor(
    topHost: HTMLDivElement,
    sideHost: HTMLDivElement,
    dialogEnforcer: DialogEnforcer,
    notationComponent: NotationComponent,
    config: ResolvedTabUIConfig,
    announce: (text: string) => void
  ) {
    this.topHost = topHost;
    this.sideHost = sideHost;
    this.dialogEnforcer = dialogEnforcer;
    this.notationComponent = notationComponent;
    this.config = config;

    this.topComponent = new TopControlsComponent(
      this.topHost,
      this.dialogEnforcer,
      this.notationComponent,
      announce
    );
    this.sideComponent = new SideControlsComponent(
      this.sideHost,
      this.dialogEnforcer,
      this.notationComponent,
      config,
      announce
    );
  }

  public render(collapsed?: boolean): void {
    this.topComponent.render();
    this.sideComponent.render(collapsed);
  }

  /** Closes editor-owned dialogs before their controls become unavailable. */
  public closeOpenDialogs(): void {
    this.dialogEnforcer.activeDialog?.close();
  }
}
