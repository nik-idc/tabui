import { BendOptionsData, BendType, GuitarTechnique } from "@/notation/model";
import { createSVGLine, createSVGText } from "@/shared";
import { BendData, Selector } from "./selector";
import { BendReleaseSelector } from "./bend-release-selector";
import { BendSelector } from "./bend-selector";
import { PrebendReleaseSelector } from "./prebend-release-selector";
import { PrebendSelector } from "./prebend-selector";
import { BendSelectorManagerOptions } from "./bend-selector-manager-options";

const selectorMap = {
  [BendType.Bend]: BendSelector,
  [BendType.BendAndRelease]: BendReleaseSelector,
  [BendType.Hold]: null,
  [BendType.Prebend]: PrebendSelector,
  [BendType.PrebendAndRelease]: PrebendReleaseSelector,
  [BendType.PrebendBend]: null,
  [BendType.Release]: null,
} as const;

function getPitchLabel(pitch: number): string {
  const labels: { [key: number]: string } = {
    0: "0",
    2: "½",
    4: "Full",
    6: "1 ½",
    8: "2",
    10: "2 ½",
    12: "3",
  };
  return labels[pitch] || "";
}

export class BendSelectorManager {
  private _bendGraphSVG: SVGSVGElement;
  private _currentOptions: BendSelectorManagerOptions;
  private _currentSelector: Selector;

  constructor(
    bendGraphSVG: SVGSVGElement,
    bendOptions?: BendSelectorManagerOptions,
    bendType?: BendType
  ) {
    this._bendGraphSVG = bendGraphSVG;

    this._currentOptions =
      bendOptions === undefined
        ? {
            width: 420,
            height: 300,
            gridOffset: 20,
            rowsCount: 12,
            colsCount: 12,
          }
        : bendOptions;

    const SelectorType =
      bendType === undefined ? BendSelector : selectorMap[bendType];

    this._currentSelector = new SelectorType!(
      this._bendGraphSVG,
      this._currentOptions
    );
  }

  private initGrid(): void {
    this._bendGraphSVG.innerHTML = "";

    // Draw rows
    for (let i = 0; i <= this._currentOptions.rowsCount; i++) {
      const y =
        (i / this._currentOptions.rowsCount) * this._currentOptions.height;
      const line = createSVGLine();
      line.setAttribute("x1", `${this._currentOptions.gridOffset}`);
      line.setAttribute("y1", `${y}`);
      line.setAttribute("x2", `${this._currentOptions.width}`);
      line.setAttribute("y2", `${y}`);
      line.setAttribute("stroke", "var(--tu-bend-grid)");
      this._bendGraphSVG.appendChild(line);

      const pitch = Math.round(
        (this._currentOptions.height - y) /
          (this._currentOptions.height / this._currentOptions.rowsCount)
      );
      const text = createSVGText();
      text.setAttribute("x", "0");
      let yPos = y + 5;
      if (pitch === 0) {
        yPos -= 5;
      }
      if (pitch === this._currentOptions.rowsCount) {
        yPos += 5;
      }
      text.setAttribute("y", `${yPos}`);
      text.classList.add("pitch-label");
      text.setAttribute("font-size", "12px");
      text.setAttribute("fill", "var(--tu-bend-label)");

      const label = getPitchLabel(pitch);
      text.textContent = label;
      this._bendGraphSVG.appendChild(text);
    }
    // Draw cols
    for (let i = 0; i <= this._currentOptions.colsCount; i++) {
      const x =
        this._currentOptions.gridOffset +
        (i / this._currentOptions.colsCount) *
          (this._currentOptions.width - this._currentOptions.gridOffset);
      const line = createSVGLine();
      line.setAttribute("x1", `${x}`);
      line.setAttribute("y1", "0");
      line.setAttribute("x2", `${x}`);
      line.setAttribute("y2", `${this._currentOptions.height}`);
      line.setAttribute("stroke", "var(--tu-bend-grid)");
      this._bendGraphSVG.appendChild(line);
    }
  }

  /**
   * Initializes the grid & current bend selector graph
   */
  public init(): void {
    this.initGrid();
    this._currentSelector.init();
  }

  /**
   * Changes bend selector type
   * @param bendType Bend type
   */
  public changeBendType(bendType: BendType): void {
    this._currentSelector.dispose();

    this.initGrid();

    const SelectorType =
      bendType === undefined ? BendSelector : selectorMap[bendType];
    this._currentSelector = new SelectorType!(
      this._bendGraphSVG,
      this._currentOptions
    );
    this._currentSelector.init();
  }

  public getCurrentTechnique(): BendOptionsData {
    return this._currentSelector.getBendTechnique();
  }
}
