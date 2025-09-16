import { BendReleaseSelectorRenderer } from "./bend-release-selector-renderer";
import { BendSelectorRenderer } from "./bend-selector-renderer";
import { PrebendReleaseSelectorRenderer } from "./prebend-release-selector-renderer";
import { PrebendSelectorRenderer } from "./prebend-selector-renderer";

type BendType = "bend" | "bend-release" | "prebend" | "prebend-release";

export class BendSelectorManager {
    private _bendGraphModal: HTMLElement;
    private _svg: SVGSVGElement;
    private _currentRenderer: BendSelectorRenderer | BendReleaseSelectorRenderer | PrebendSelectorRenderer | PrebendReleaseSelectorRenderer | undefined;
    private _bendTypeList: HTMLUListElement;

    constructor(bendGraphModal: HTMLElement) {
        this._bendGraphModal = bendGraphModal;
        const svg = this._bendGraphModal.querySelector("#bend-graph-svg") as SVGSVGElement;
        if (svg === null) {
            throw new Error("Bend graph SVG not found");
        }
        this._svg = svg;

        const bendTypeList = this._bendGraphModal.querySelector(".bend-type-list") as HTMLUListElement;
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

        const closeButton = this._bendGraphModal.querySelector(".close-button") as HTMLElement;
        if (closeButton) {
            closeButton.addEventListener("click", () => this.hide());
        }
    }

    public show() {
        this._bendGraphModal.style.display = "flex";
        this.renderSelector("bend");
    }

    public hide() {
        this._bendGraphModal.style.display = "none";
        if (this._currentRenderer) {
            this._currentRenderer.unrender();
        }
    }

    private setupBendTypeSelection() {
        this._bendTypeList.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === "LI") {
                const bendType = target.dataset.bendType as BendType;
                this.renderSelector(bendType);
            }
        });
    }

    private renderSelector(bendType: BendType) {
        if (this._currentRenderer) {
            this._currentRenderer.unrender();
        }

        const selectedLi = this._bendTypeList.querySelector(".selected");
        if (selectedLi) {
            selectedLi.classList.remove("selected");
        }
        const newSelectedLi = this._bendTypeList.querySelector(`[data-bend-type="${bendType}"]`);
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
