import { NotationComponent } from "../notation/notation-component";
import { ResolvedTabUIConfig } from "../config/tabui-config";
import { SideControlsComponent } from "./side-controls/side-controls-component";
import { TopControlsComponent } from "./top-controls";

export class UIComponent {
  readonly topHost: HTMLDivElement;
  readonly sideHost: HTMLDivElement;
  readonly dialogHost: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly config: ResolvedTabUIConfig;

  readonly topComponent: TopControlsComponent;
  readonly sideComponent: SideControlsComponent;

  constructor(
    topHost: HTMLDivElement,
    sideHost: HTMLDivElement,
    dialogHost: HTMLDivElement,
    notationComponent: NotationComponent,
    config: ResolvedTabUIConfig
  ) {
    this.topHost = topHost;
    this.sideHost = sideHost;
    this.dialogHost = dialogHost;
    this.notationComponent = notationComponent;
    this.config = config;

    this.topComponent = new TopControlsComponent(
      this.topHost,
      this.dialogHost,
      this.notationComponent
    );
    this.sideComponent = new SideControlsComponent(
      this.sideHost,
      this.dialogHost,
      this.notationComponent,
      config
    );
  }

  public render(collapsed?: boolean): void {
    this.topComponent.render();
    this.sideComponent.render(collapsed);
  }

  /** Closes editor-owned dialogs before their controls become unavailable. */
  public closeOpenDialogs(): void {
    const dialogs =
      this.dialogHost.querySelectorAll<HTMLDialogElement>(".tu-dialog[open]");
    for (const dialog of dialogs) {
      dialog.close();
    }
  }
}
