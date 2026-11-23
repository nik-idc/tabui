import { NotationComponent } from "../../notation/notation-component";
import { ScoreHeaderTemplate } from "./score-header-template";
import { ScoreHeaderTemplateRenderer } from "./score-header-template-renderer";

/** Score title, artist, album, and release date above the notation. */
export class ScoreHeaderComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: ScoreHeaderTemplate;
  readonly templateRenderer: ScoreHeaderTemplateRenderer;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new ScoreHeaderTemplate();
    this.templateRenderer = new ScoreHeaderTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render(this.notationComponent.score);
  }
}
