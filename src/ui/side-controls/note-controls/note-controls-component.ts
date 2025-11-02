import { NotationComponent } from "@/notation/notation-component";
import { NoteControlsEventHandler, NoteControlsDefaultEventHandler } from "./note-controls-event-handler";
import { NoteControlsTemplate } from "./note-controls-template";
import { NoteControlsTemplateRenderer } from "./note-controls-template-renderer";

export class NoteControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: NoteControlsTemplate;
  readonly templateRenderer: NoteControlsTemplateRenderer;
  readonly eventHandler: NoteControlsEventHandler;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new NoteControlsTemplate();
    this.templateRenderer = new NoteControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new NoteControlsDefaultEventHandler();

    this._eventsBound = false;
  }

  private bind(): void {
    for (const durationButton of this.template.noteDurationButtons) {
      const duration = 1 / Number(durationButton.dataset["duration"]);
      durationButton.addEventListener("click", () =>
        this.eventHandler.onDurationClicked(duration, this.notationComponent)
      );
    }

    this.template.dot1Button.addEventListener("click", () =>
      this.eventHandler.onDotClicked(1, this.notationComponent)
    );
    this.template.dot2Button.addEventListener("click", () =>
      this.eventHandler.onDotClicked(2, this.notationComponent)
    );

    this.template.tuplet2Button.addEventListener("click", () =>
      this.eventHandler.onTupletNormalClicked(2, this.notationComponent)
    );
    this.template.tuplet3Button.addEventListener("click", () =>
      this.eventHandler.onTupletNormalClicked(3, this.notationComponent)
    );
    this.template.tupletButton.addEventListener("click", () =>
      this.eventHandler.onTupletClicked(this.notationComponent)
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
