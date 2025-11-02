import { NotationComponent } from "@/notation/notation-component";
import { PlayControlsEventHandler, PlayControlsDefaultEventHandler } from "./play-controls-event-handler";
import { PlayControlsTemplate } from "./play-controls-template";
import { PlayControlsTemplateRenderer } from "./play-controls-template-renderer";

export class PlayControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: PlayControlsTemplate;
  readonly templateRenderer: PlayControlsTemplateRenderer;
  readonly eventHandler: PlayControlsEventHandler;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new PlayControlsTemplate();
    this.templateRenderer = new PlayControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new PlayControlsDefaultEventHandler();

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.firstButton.addEventListener("click", () =>
      this.eventHandler.onFirstClicked(this.notationComponent, this.template)
    );
    this.template.prevButton.addEventListener("click", () =>
      this.eventHandler.onPrevClicked(this.notationComponent, this.template)
    );
    this.template.playButton.addEventListener("click", () =>
      this.eventHandler.onPlayClicked(this.notationComponent, this.template)
    );
    this.template.nextButton.addEventListener("click", () =>
      this.eventHandler.onNextClicked(this.notationComponent, this.template)
    );
    this.template.lastButton.addEventListener("click", () =>
      this.eventHandler.onLastClicked(this.notationComponent, this.template)
    );
    this.template.loopButton.addEventListener("click", () =>
      this.eventHandler.onLoopClicked(this.notationComponent, this.template)
    );
  }

  public render(): void {
    // 1. Set up template
    this.templateRenderer.render();

    // 2. Bind events
    if (!this._eventsBound) {
      this.bind();
      this._eventsBound = true;
    }
  }
}
