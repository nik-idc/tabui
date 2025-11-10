import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsTemplate } from "./play-controls-template";
import { PlayControlsTemplateRenderer } from "./play-controls-template-renderer";

export class PlayControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: PlayControlsTemplate;
  readonly templateRenderer: PlayControlsTemplateRenderer;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new PlayControlsTemplate();
    this.templateRenderer = new PlayControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
