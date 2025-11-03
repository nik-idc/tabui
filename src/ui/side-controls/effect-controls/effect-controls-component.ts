import { NotationComponent } from "@/notation/notation-component";
import { template } from "@babel/core";
import {
  EffectControlsEventHandler,
  EffectControlsDefaultEventHandler,
} from "./effect-controls-event-handler";
import { EffectControlsTemplate } from "./effect-controls-template";
import { EffectControlsTemplateRenderer } from "./effect-controls-template-renderer";
import { BendControlsComponent } from "./bend-controls/bend-controls-component";
import { TimeSigControlsComponent } from "./time-sig-controls";

export class EffectControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: EffectControlsTemplate;
  readonly templateRenderer: EffectControlsTemplateRenderer;
  readonly eventHandler: EffectControlsEventHandler;

  private _bendControlsComponent: BendControlsComponent;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new EffectControlsTemplate();
    this.templateRenderer = new EffectControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new EffectControlsDefaultEventHandler();

    this._bendControlsComponent = new BendControlsComponent(
      this.rootDiv,
      this.notationComponent
    );

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.vibratoButton.addEventListener("click", () =>
      this.eventHandler.onVibratoClicked(this.notationComponent)
    );
    this.template.palmMuteButton.addEventListener("click", () =>
      this.eventHandler.onPalmMuteClicked(this.notationComponent)
    );
    this.template.nhButton.addEventListener("click", () =>
      this.eventHandler.onNHClicked(this.notationComponent)
    );
    this.template.phButton.addEventListener("click", () =>
      this.eventHandler.onPHClicked(this.notationComponent)
    );
    this.template.hammerOnButton.addEventListener("click", () =>
      this.eventHandler.onHammerOnClicked(this.notationComponent)
    );
    this.template.pullOffButton.addEventListener("click", () =>
      this.eventHandler.onPullOffClicked(this.notationComponent)
    );
    this.template.slideButton.addEventListener("click", () =>
      this.eventHandler.onSlideClicked(this.notationComponent)
    );
    this.template.bendButton.addEventListener("click", () =>
      this.eventHandler.onBendClicked(
        this.notationComponent,
        this._bendControlsComponent
      )
    );
  }

  public render(): void {
    // 1. Set up template
    this.templateRenderer.render();
    this._bendControlsComponent.render();

    // 2. Bind events
    if (!this._eventsBound) {
      this.bind();
      this._eventsBound = true;
    }
  }
}
