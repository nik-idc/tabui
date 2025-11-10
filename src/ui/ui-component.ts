import { NotationComponent } from "@/notation/notation-component";
import { SideControlsComponent } from "./side-controls/side-contros-component";
import { TopControlsComponent } from "./top-controls";
import "./styles.scss";

export class UIComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly topComponent: TopControlsComponent;
  readonly sideComponent: SideControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

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
    this.notationComponent.rootDiv.classList.add("tu-editor");

    this.topComponent.render();
    this.sideComponent.render();
  }
}
