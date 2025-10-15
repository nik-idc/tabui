import { GuitarEffectOptions } from "../../../models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../../../models/guitar-effect/guitar-effect-type";
import { TabWindow } from "../../tab-window";
import { BendReleaseSelectorRenderer } from "./bend-release-selector-renderer";
import { BendSelectorRenderer } from "./bend-selector-renderer";
import { PrebendReleaseSelectorRenderer } from "./prebend-release-selector-renderer";
import { PrebendSelectorRenderer } from "./prebend-selector-renderer";

type BendType = "bend" | "bend-release" | "prebend" | "prebend-release";

export class BendSelectorManager {
  private _bendGraphModal: HTMLElement;
  private _svg: SVGSVGElement;
  private _currentRenderer:
    | BendSelectorRenderer
    | BendReleaseSelectorRenderer
    | PrebendSelectorRenderer
    | PrebendReleaseSelectorRenderer
    | undefined;
  private _bendTypeList: HTMLUListElement;
  private _onApply?: (
    effectType: GuitarEffectType,
    options: GuitarEffectOptions
  ) => void;

  constructor(bendGraphModal: HTMLElement) {
    this._bendGraphModal = bendGraphModal;
    const svg = this._bendGraphModal.querySelector(
      "#bend-graph-svg"
    ) as SVGSVGElement;
    if (svg === null) {
      throw new Error("Bend graph SVG not found");
    }
    this._svg = svg;

    const bendTypeList = this._bendGraphModal.querySelector(
      ".bend-type-list"
    ) as HTMLUListElement;
    if (bendTypeList === null) {
      throw new Error("Bend type list not found");
    }
    this._bendTypeList = bendTypeList;

    this.setupBendTypeSelection();

    this._bendGraphModal.addEventListener("click", (event) => {
      if (event.target === this._bendGraphModal) {
        this.hide();
      }
    });

    const confirmButton = document.getElementById("bend-modal-confirm");
    if (confirmButton) {
      confirmButton.addEventListener("click", () => this.apply());
    }
    const cancelButton = document.getElementById("bend-modal-cancel");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => this.hide());
    }
  }

  public show(
    onApply: (
      effectType: GuitarEffectType,
      options: GuitarEffectOptions
    ) => void
  ): void {
    this._onApply = onApply;
    this._bendGraphModal.style.display = "flex";
    this.renderSelector("bend");
  }

  public hide(): void {
    this._bendGraphModal.style.display = "none";
    if (this._currentRenderer) {
      this._currentRenderer.unrender();
    }
  }

  public apply(): void {
    if (!this._currentRenderer) {
      return;
    }

    let effectType: GuitarEffectType | undefined;
    let options: GuitarEffectOptions | undefined;

    if (this._currentRenderer instanceof BendSelectorRenderer) {
      const values = this._currentRenderer.getValues();
      effectType = GuitarEffectType.Bend;
      options = new GuitarEffectOptions(values.pitch);
    } else if (this._currentRenderer instanceof BendReleaseSelectorRenderer) {
      const values = this._currentRenderer.getValues();
      effectType = GuitarEffectType.BendAndRelease;
      options = new GuitarEffectOptions(
        values.peak.pitch,
        values.release.pitch
      );
    } else if (this._currentRenderer instanceof PrebendSelectorRenderer) {
      const values = this._currentRenderer.getValues();
      effectType = GuitarEffectType.Prebend;
      options = new GuitarEffectOptions(undefined, undefined, values.pitch);
    } else if (
      this._currentRenderer instanceof PrebendReleaseSelectorRenderer
    ) {
      const values = this._currentRenderer.getValues();
      effectType = GuitarEffectType.PrebendAndRelease;
      options = new GuitarEffectOptions(
        values.start.pitch,
        values.release.pitch
      );
    }

    if (
      effectType !== undefined &&
      options !== undefined &&
      this._onApply !== undefined
    ) {
      this._onApply(effectType, options);
    }

    this.hide();
  }

  private setupBendTypeSelection(): void {
    this._bendTypeList.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "LI") {
        const bendType = target.dataset.bendType as BendType;
        this.renderSelector(bendType);
      }
    });
  }

  private renderSelector(bendType: BendType): void {
    if (this._currentRenderer) {
      this._currentRenderer.unrender();
    }

    const selectedLi = this._bendTypeList.querySelector(".selected");
    if (selectedLi) {
      selectedLi.classList.remove("selected");
    }
    const newSelectedLi = this._bendTypeList.querySelector(
      `[data-bend-type="${bendType}"]`
    );
    if (newSelectedLi) {
      newSelectedLi.classList.add("selected");
    }

    switch (bendType) {
      case "bend":
        this._currentRenderer = new BendSelectorRenderer(this._svg);
        break;
      case "bend-release":
        this._currentRenderer = new BendReleaseSelectorRenderer(this._svg);
        break;
      case "prebend":
        this._currentRenderer = new PrebendSelectorRenderer(this._svg);
        break;
      case "prebend-release":
        this._currentRenderer = new PrebendReleaseSelectorRenderer(this._svg);
        break;
    }

    this._currentRenderer.render();
  }
}
