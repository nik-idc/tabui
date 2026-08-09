import { NotationComponent } from "../../../notation/notation-component";
import { renderOnce, setImageAsset } from "../../shared";
import { MeasureControlsTemplate } from "./measure-controls-template";
import { BarRepeatStatus } from "../../../notation";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class MeasureControlsTemplateRenderer {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;
  readonly template: MeasureControlsTemplate;
  readonly assetsPath: ResolvedAssetConfig;

  private _assembled: boolean;

  constructor(
    parentDiv: HTMLDivElement,
    notationComponent: NotationComponent,
    template: MeasureControlsTemplate,
    assetsPath: ResolvedAssetConfig = notationComponent.config.assets
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
      this.template.repeatStartButton,
      this.template.repeatEndButton,
      this.template.timeSignatureButton,
      this.template.tempoButton,
      this.template.insertBarBeforeButton,
      this.template.insertBarAfterButton,
      this.template.removeBarButton
    );

    this.parentDiv.appendChild(this.template.container);
  }

  private renderRepeatButtonsState(): void {
    const selectedNote = this.notationComponent.trackController.selectedNote;
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
          this.template.repeatEndButton.classList.remove(appliedCSSClass);
          this.template.repeatEndButton.classList.remove(disabledCSSClass);
          break;
        case BarRepeatStatus.End:
          this.template.repeatStartButton.classList.remove(appliedCSSClass);
          this.template.repeatStartButton.classList.remove(disabledCSSClass);
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
    setImageAsset(
      this.template.tempoButton,
      this.assetsPath,
      "img/ui/tempo.svg",
      "Tempo"
    );
    setImageAsset(
      this.template.timeSignatureButton,
      this.assetsPath,
      "img/ui/measure.svg",
      "Time Signature"
    );
    setImageAsset(
      this.template.repeatStartButton,
      this.assetsPath,
      "img/ui/repeat-start.svg",
      "Repeat Start"
    );
    setImageAsset(
      this.template.repeatEndButton,
      this.assetsPath,
      "img/ui/repeat-end.svg",
      "Repeat Start"
    );
    setImageAsset(
      this.template.insertBarBeforeButton,
      this.assetsPath,
      "img/ui/add-before.svg",
      "Insert bar before",
      {
        "data-bar-action": "insert-before",
      }
    );
    this.template.insertBarBeforeButton.title = "Insert bar before";

    setImageAsset(
      this.template.insertBarAfterButton,
      this.assetsPath,
      "img/ui/add-after.svg",
      "Insert bar after",
      {
        "data-bar-action": "insert-after",
      }
    );
    this.template.insertBarAfterButton.title = "Insert bar after";

    setImageAsset(
      this.template.removeBarButton,
      this.assetsPath,
      "img/ui/remove.svg",
      "Remove bar",
      {
        "data-bar-action": "remove",
      }
    );
    this.template.removeBarButton.title = "Remove bar";

    this.renderRepeatButtonsState();
  }

  public render(): void {
    this.renderMeasureButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
