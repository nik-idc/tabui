import { NotationComponent } from "../../../notation/notation-component";
import { renderOnce, setImageAsset, setShortcutTooltip } from "../../shared";
import { MeasureControlsTemplate } from "./measure-controls-template";
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
    const selectionCursor =
      this.notationComponent.trackController.selectionCursor;
    const appliedCSSClass = "tu-applied-img";
    const disabledCSSClass = "tu-disabled-img";

    this.template.repeatStartButton.disabled = selectionCursor === undefined;
    this.template.repeatEndButton.disabled = selectionCursor === undefined;
    if (selectionCursor === undefined) {
      this.template.repeatStartButton.classList.remove(appliedCSSClass);
      this.template.repeatStartButton.classList.add(disabledCSSClass);
      this.template.repeatEndButton.classList.remove(appliedCSSClass);
      this.template.repeatEndButton.classList.add(disabledCSSClass);
    } else {
      this.template.repeatStartButton.classList.toggle(
        appliedCSSClass,
        selectionCursor.bar.masterBar.isRepeatStart
      );
      this.template.repeatEndButton.classList.toggle(
        appliedCSSClass,
        selectionCursor.bar.masterBar.isRepeatEnd
      );
      this.template.repeatStartButton.classList.remove(disabledCSSClass);
      this.template.repeatEndButton.classList.remove(disabledCSSClass);
    }
    this.template.repeatStartButton.setAttribute(
      "aria-pressed",
      `${selectionCursor?.bar.masterBar.isRepeatStart ?? false}`
    );
    this.template.repeatEndButton.setAttribute(
      "aria-pressed",
      `${selectionCursor?.bar.masterBar.isRepeatEnd ?? false}`
    );
  }

  private renderMeasureButtons(): void {
    setImageAsset(
      this.template.tempoButton,
      this.assetsPath,
      "img/ui/tempo.svg",
      "Tempo"
    );
    setShortcutTooltip(this.template.tempoButton, "Tempo", "m");
    setImageAsset(
      this.template.timeSignatureButton,
      this.assetsPath,
      "img/ui/measure.svg",
      "Time Signature"
    );
    setShortcutTooltip(
      this.template.timeSignatureButton,
      "Time Signature",
      "Shift+M"
    );
    setImageAsset(
      this.template.repeatStartButton,
      this.assetsPath,
      "img/ui/repeat-start.svg",
      "Repeat Start"
    );
    setShortcutTooltip(this.template.repeatStartButton, "Repeat Start", "r");
    setImageAsset(
      this.template.repeatEndButton,
      this.assetsPath,
      "img/ui/repeat-end.svg",
      "Repeat End"
    );
    setShortcutTooltip(
      this.template.repeatEndButton,
      "Repeat End and count",
      "Shift+R"
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
    setShortcutTooltip(
      this.template.insertBarBeforeButton,
      "Insert bar before",
      "Shift+I"
    );

    setImageAsset(
      this.template.insertBarAfterButton,
      this.assetsPath,
      "img/ui/add-after.svg",
      "Insert bar after",
      {
        "data-bar-action": "insert-after",
      }
    );
    setShortcutTooltip(
      this.template.insertBarAfterButton,
      "Insert bar after",
      "i"
    );

    setImageAsset(
      this.template.removeBarButton,
      this.assetsPath,
      "img/ui/remove.svg",
      "Remove bar",
      {
        "data-bar-action": "remove",
      }
    );
    setShortcutTooltip(
      this.template.removeBarButton,
      "Remove all selected bars",
      "Shift+Delete"
    );

    this.renderRepeatButtonsState();
  }

  public render(): void {
    this.renderMeasureButtons();

    this._assembled = renderOnce(this._assembled, () =>
      this.assembleContainer()
    );
  }
}
