import { NotationComponent } from "@/notation/notation-component";
import { YesNoTemplateRenderer } from "./yes-no-template-renderer";
import { YesNoTemplate } from "./yes-no-template";

export class YesNoComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: YesNoTemplate;
  readonly templateRenderer: YesNoTemplateRenderer;

  private _text: string;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    text: string = "Are you sure?"
  ) {
    this._text = text;

    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new YesNoTemplate();
    this.templateRenderer = new YesNoTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template,
      this._text
    );
  }

  public render(): void {
    this.templateRenderer.render();
  }
}
