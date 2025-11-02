import { NotationComponent } from "@/notation/notation-component";
import {
  BendControlsEventHandler,
  BendControlsDefaultEventHandler,
} from "./bend-controls-event-handler";
import { BendControlsTemplate } from "./bend-controls-template";
import { BendControlsTemplateRenderer } from "./bend-controls-template-renderer";
import { BendSelectorManager } from "./bend-selectors";

export class BendControlsComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: BendControlsTemplate;
  readonly templateRenderer: BendControlsTemplateRenderer;
  readonly eventHandler: BendControlsEventHandler;
  readonly bendSelectorManager: BendSelectorManager;

  private _eventsBound: boolean;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.template = new BendControlsTemplate();
    this.templateRenderer = new BendControlsTemplateRenderer(
      this.rootDiv,
      this.notationComponent,
      this.template
    );
    this.eventHandler = new BendControlsDefaultEventHandler();
    this.bendSelectorManager = new BendSelectorManager(
      this.template.bendSelectorGraphSVG
    );

    this._eventsBound = false;
  }

  private bind(): void {
    this.template.bendControlsDialog.addEventListener(
      "click",
      (event: MouseEvent) => {
        this.eventHandler.onDialogClicked(this.template, event);
      }
    );

    this.template.bendTypesButtons[0].addEventListener("click", () => {
      this.eventHandler.onBendTypeClicked("bend", this.bendSelectorManager);
    });
    this.template.bendTypesButtons[1].addEventListener("click", () => {
      this.eventHandler.onBendTypeClicked("prebend", this.bendSelectorManager);
    });
    this.template.bendTypesButtons[2].addEventListener("click", () => {
      this.eventHandler.onBendTypeClicked(
        "bend-release",
        this.bendSelectorManager
      );
    });
    this.template.bendTypesButtons[3].addEventListener("click", () => {
      this.eventHandler.onBendTypeClicked(
        "prebend-release",
        this.bendSelectorManager
      );
    });

    this.template.confirmButton.addEventListener("click", () => {
      this.eventHandler.onConfirmClicked(
        this.template,
        this.notationComponent,
        this.bendSelectorManager
      );
    });
    this.template.cancelButton.addEventListener("click", () => {
      this.eventHandler.onCancelClicked(this.template);
    });
  }

  public render(): void {
    this.templateRenderer.render();
    this.bendSelectorManager.init();

    if (!this._eventsBound) {
      this.bind();
      this._eventsBound = true;
    }
  }
}
