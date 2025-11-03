import { NotationComponent } from "@/notation/notation-component";
import { BendControlsComponent } from "../bend-controls";
import {
  TimeSigControlsEventHandler,
  TimeSigControlsDefaultEventHandler,
} from "./time-sig-controls-event-handler";
import { TimeSigControlsTemplate } from "./time-sig-controls-template";
import { TimeSigControlsTemplateRenderer } from "./time-sig-controls-template-renderer";

export class TimeSigControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TimeSigControlsTemplate;
  readonly templateRenderer: TimeSigControlsTemplateRenderer;
  readonly eventHandler: TimeSigControlsEventHandler;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new TimeSigControlsTemplate();
    this.templateRenderer = new TimeSigControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new TimeSigControlsDefaultEventHandler();

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.timeSigDialogContent.addEventListener(
      "click",
      (event: Event) =>
        this.eventHandler.onDialogClicked(this.template, event as MouseEvent)
    );
    this.template.beatsInput.addEventListener("input", (event: Event) =>
      this.eventHandler.onBeatsChanged(
        event as InputEvent,
        this.notationComponent,
        this.template
      )
    );
    this.template.durationInput.addEventListener("input", (event: Event) =>
      this.eventHandler.onDurationChanged(
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
