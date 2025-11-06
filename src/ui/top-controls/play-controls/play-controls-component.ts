import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsTemplate } from "./play-controls-template";
import { PlayControlsTemplateRenderer } from "./play-controls-template-renderer";

export class PlayControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: PlayControlsTemplate;
  readonly templateRenderer: PlayControlsTemplateRenderer;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new PlayControlsTemplate();
    this.templateRenderer = new PlayControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
