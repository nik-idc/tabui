import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsDefaultEventHandler } from "./measure-controls-event-handler";
import { MeasureControlsEventHandler } from "./measure-controls-event-handler";
import { MeasureControlsTemplate } from "./measure-controls-template";
import { MeasureControlsTemplateRenderer } from "./measure-controls-template-renderer";
import { TimeSigControlsComponent } from "../effect-controls/time-sig-controls";

export class MeasureControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: MeasureControlsTemplate;
  readonly templateRenderer: MeasureControlsTemplateRenderer;
  readonly eventHandler: MeasureControlsEventHandler;

  private _timeSigControlsComponent: TimeSigControlsComponent;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new MeasureControlsTemplate();
    this.templateRenderer = new MeasureControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new MeasureControlsDefaultEventHandler();

    this._timeSigControlsComponent = new TimeSigControlsComponent(
      this.rootDiv,
      this.notationComponent
    );

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.tempoButton.addEventListener("click", () =>
      this.eventHandler.onTempoClicked(this.notationComponent)
    );
    this.template.timeSignatureButton.addEventListener("click", () =>
      this.eventHandler.onTimeSignatureClicked(
        this.notationComponent,
        this._timeSigControlsComponent
      )
    );
    this.template.repeatStartButton.addEventListener("click", () =>
      this.eventHandler.onRepeatStartClicked(this.notationComponent)
    );
    this.template.repeatEndButton.addEventListener("click", () =>
      this.eventHandler.onRepeatEndClicked(this.notationComponent)
    );
  }

  public render(): void {
    // 1. Set up template
    this.templateRenderer.render();
    this._timeSigControlsComponent.render();

    // 2. Bind events
    if (!this._eventsBound) {
      this.bind();
      this._eventsBound = true;
    }
  }
}
