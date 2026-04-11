import { NotationComponent } from "@/notation/notation-component";
import { ResolvedTabUIConfig } from "@/config/tabui-config";
import { SideControlsComponent } from "./side-controls/side-controls-component";
import { TopControlsComponent } from "./top-controls";

export class UIComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly config: ResolvedTabUIConfig;

  readonly topComponent: TopControlsComponent;
  readonly sideComponent: SideControlsComponent;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    config: ResolvedTabUIConfig
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.config = config;

    this.topComponent = new TopControlsComponent(
      this.parentDiv,
      this.notationComponent
    );
    this.sideComponent = new SideControlsComponent(
      this.parentDiv,
      this.notationComponent
    );
  }

  public render(): void {
    this.topComponent.render();
    this.sideComponent.render();
  }
}
