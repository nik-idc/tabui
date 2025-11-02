import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsTemplate } from "./measure-controls-template";

export class MeasureControlsTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: MeasureControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    rootDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: MeasureControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-measure-controls";
    this.template.measureControlsContainer.classList.add(cssClass);

    this.template.measureControlsContainer.append(
      this.template.tempoButton,
      this.template.timeSignatureButton,
      this.template.repeatStartButton,
      this.template.repeatEndButton
    );

    this.rootDiv.appendChild(this.template.measureControlsContainer);
  }

  private renderMeasureButtons(): void {
    const tempoSrc = `${this.assetsPath}/img/ui/tempo.svg`;
    this.template.tempoButton.setAttribute("src", tempoSrc);
    this.template.tempoButton.setAttribute("alt", "Tempo");

    const tsSrc = `${this.assetsPath}/img/ui/measure.svg`;
    this.template.timeSignatureButton.setAttribute("src", tsSrc);
    this.template.timeSignatureButton.setAttribute("alt", "Time Signature");

    const repeatStartSrc = `${this.assetsPath}/img/ui/repeat-start.svg`;
    this.template.repeatStartButton.setAttribute("src", repeatStartSrc);
    this.template.repeatStartButton.setAttribute("alt", "Repeat Start");

    const repeatEndSrc = `${this.assetsPath}/img/ui/repeat-end.svg`;
    this.template.repeatEndButton.setAttribute("src", repeatEndSrc);
    this.template.repeatEndButton.setAttribute("alt", "Repeat Start");
  }

  public render(): void {
    this.renderMeasureButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
