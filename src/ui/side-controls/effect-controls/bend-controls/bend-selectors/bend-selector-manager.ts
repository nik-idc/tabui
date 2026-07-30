import { BendOptionsData, BendType } from "../../../../../notation/model";
import { createSVGLine, createSVGText } from "../../../../../shared";
import { Selector } from "./selector";
import { BendSelectorManagerOptions } from "./bend-selector-manager-options";
import { BendCurveSelector } from "./bend-curve-selector";

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
  private _currentSelector?: Selector;
  private _currentTechnique: BendOptionsData;
  private _continuationPitch?: number;

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

    this._currentTechnique = {
      type: bendType ?? BendType.Bend,
      bendPitch: 1,
      bendDuration: 0.75,
    };
    this._continuationPitch = undefined;
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
  public init(
    bendOptions: BendOptionsData = {
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 0.75,
    },
    continuationPitch?: number
  ): void {
    this._currentSelector?.dispose();
    this._currentTechnique = bendOptions;
    this._continuationPitch = continuationPitch;
    this.initGrid();
    this._currentSelector = new BendCurveSelector(
      this._bendGraphSVG,
      this._currentOptions,
      bendOptions,
      continuationPitch
    );
    this._currentSelector.init();
  }

  /**
   * Changes bend selector type
   * @param bendType Bend type
   */
  public changeBendType(bendType: BendType): void {
    this.init({ type: bendType }, this._continuationPitch);
  }

  public getCurrentTechnique(): BendOptionsData {
    if (this._currentSelector === undefined) {
      return this._currentTechnique;
    }
    return this._currentSelector.getBendTechnique();
  }

  public dispose(): void {
    this._currentSelector?.dispose();
    this._currentSelector = undefined;
  }
}
