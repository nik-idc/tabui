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

    const confirmButton = document.getElementById("input-modal-confirm");
    if (confirmButton) {
      confirmButton.addEventListener("click", () => this.apply());
    }
    const cancelButton = document.getElementById("input-modal-cancel");
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

  private applyBend(): void {
    const bendCircle = document.getElementById("bendCircle");
    if (bendCircle === null) {
      throw Error("Bend circle null on apply bend");
    }

    const bendDuration = Number(bendCircle.getAttribute("cx"));
    const bendPitch = 300 / (300 - Number(bendCircle.getAttribute("cy")));
    const options = new GuitarEffectOptions(bendPitch);

    if (this._onApply !== undefined) {
      this._onApply(GuitarEffectType.Bend, options);
    }
  }

  private applyBendAndRelease(): void {
    const bendCircle = document.getElementById("bendCircle");
    if (bendCircle === null) {
      throw Error("Bend circle null on apply bend");
    }
    const releaseCircle = document.getElementById("releaseCircle");
    if (releaseCircle === null) {
      throw Error("Release circle null on apply bend");
    }

    const bendDuration = Number(bendCircle.getAttribute("cx"));
    const bendPitch = 300 / (300 - Number(bendCircle.getAttribute("cy")));
    const releaseDuration = Number(releaseCircle.getAttribute("cx"));
    const releasePitch = 300 / (300 - Number(releaseCircle.getAttribute("cy")));
    const options = new GuitarEffectOptions(bendPitch, releasePitch);

    if (this._onApply !== undefined) {
      this._onApply(GuitarEffectType.BendAndRelease, options);
    }
  }

  private applyPrebend(): void {
    const prebendCircle = document.getElementById("prebendCircle");
    if (prebendCircle === null) {
      throw Error("Bend circle null on apply bend");
    }

    const prebendDuration = Number(prebendCircle.getAttribute("cx"));
    const prebendPitch = 300 / (300 - Number(prebendCircle.getAttribute("cy")));
    const options = new GuitarEffectOptions(undefined, undefined, prebendPitch);

    if (this._onApply !== undefined) {
      this._onApply(GuitarEffectType.Prebend, options);
    }
  }

  private applyPrebendAndRelease(): void {
    const prebendCircle = document.getElementById("prebendCircle");
    if (prebendCircle === null) {
      throw Error("Bend circle null on apply bend");
    }
    const releaseCircle = document.getElementById("releaseCircle");
    if (releaseCircle === null) {
      throw Error("Release circle null on apply bend");
    }

    const prebendDuration = Number(prebendCircle.getAttribute("cx"));
    const prebendPitch = 300 / (300 - Number(prebendCircle.getAttribute("cy")));
    const releaseDuration = Number(releaseCircle.getAttribute("cx"));
    const releasePitch = 300 / (300 - Number(releaseCircle.getAttribute("cy")));
    const options = new GuitarEffectOptions(prebendPitch, releasePitch);

    if (this._onApply !== undefined) {
      this._onApply(GuitarEffectType.PrebendAndRelease, options);
    }
  }

  public apply(): void {
    // Get bend circle's cx and cy attributes
    if (this._currentRenderer instanceof BendSelectorRenderer) {
      this.applyBend();
    } else if (this._currentRenderer instanceof BendReleaseSelectorRenderer) {
      this.applyBendAndRelease();
    } else if (this._currentRenderer instanceof PrebendSelectorRenderer) {
      this.applyPrebend();
    } else if (
      this._currentRenderer instanceof PrebendReleaseSelectorRenderer
    ) {
      this.applyPrebendAndRelease();
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
