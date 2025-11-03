import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../bend-controls";
import {
  TempoControlsEventHandler,
  TempoControlsDefaultEventHandler,
} from "./tempo-controls-event-handler";
import { TempoControlsTemplate } from "./tempo-controls-template";
import { TempoControlsTemplateRenderer } from "./tempo-controls-template-renderer";

export class TempoControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TempoControlsTemplate;
  readonly templateRenderer: TempoControlsTemplateRenderer;
  readonly eventHandler: TempoControlsEventHandler;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new TempoControlsTemplate();
    this.templateRenderer = new TempoControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new TempoControlsDefaultEventHandler();

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.tempoDialogContent.addEventListener("click", (event: Event) =>
      this.eventHandler.onDialogClicked(this.template, event as MouseEvent)
    );
    this.template.tempoInput.addEventListener("input", (event: Event) =>
      this.eventHandler.onTempoChanged(
        event as InputEvent,
        this.notationComponent,
        this.template
      )
    );
    this.template.confirmButton.addEventListener("click", (event: Event) =>
      this.eventHandler.onConfirmClicked(this.notationComponent, this.template)
    );
    this.template.cancelButton.addEventListener("click", (event: Event) =>
      this.eventHandler.onCancelClicked(this.notationComponent, this.template)
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
