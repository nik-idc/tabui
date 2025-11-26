import { NotationComponent } from "@/notation/notation-component";
import { MeasureControlsTemplate } from "./measure-controls-template";
import { BarRepeatStatus } from "@/notation";

export class MeasureControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: MeasureControlsTemplate;
  readonly assetsPath: string;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: MeasureControlsTemplate,
    assetsPath: string = import.meta.env.BASE_URL
  ) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;
    this.template = template;
    this.assetsPath = assetsPath;

    this._assembled = false;
  }

  private assembleContainer(): void {
    const cssClass = "tu-measure-controls";
    this.template.container.classList.add(cssClass);

    this.template.container.append(
      this.template.tempoButton,
      this.template.timeSignatureButton,
      this.template.repeatStartButton,
      this.template.repeatEndButton
    );

    this.parentDiv.appendChild(this.template.container);
  }

  private renderRepeatButtonsState(): void {
    const selectedNote =
      this.notationComponent.trackController.trackControllerEditor
        .selectionManager.selectedNote;
    const appliedCSSClass = "tu-applied-img";
    const disabledCSSClass = "tu-disabled-img";

    if (selectedNote === undefined) {
      this.template.repeatStartButton.classList.remove(appliedCSSClass);
      this.template.repeatStartButton.classList.add(disabledCSSClass);
      this.template.repeatEndButton.classList.remove(appliedCSSClass);
      this.template.repeatEndButton.classList.add(disabledCSSClass);
    } else {
      const repeatStatus = selectedNote.bar.masterBar.repeatStatus;
      switch (repeatStatus) {
        case BarRepeatStatus.Start:
          this.template.repeatStartButton.classList.add(appliedCSSClass);
          this.template.repeatStartButton.classList.remove(disabledCSSClass);
          break;
        case BarRepeatStatus.End:
          this.template.repeatEndButton.classList.add(appliedCSSClass);
          this.template.repeatEndButton.classList.remove(disabledCSSClass);
          break;
        default:
          this.template.repeatStartButton.classList.remove(appliedCSSClass);
          this.template.repeatStartButton.classList.remove(disabledCSSClass);
          this.template.repeatEndButton.classList.remove(appliedCSSClass);
          this.template.repeatEndButton.classList.remove(disabledCSSClass);
          break;
      }
    }
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

    this.renderRepeatButtonsState();
  }

  public render(): void {
    this.renderMeasureButtons();

    if (!this._assembled) {
      this.assembleContainer();
      this._assembled = true;
    }
  }
}
