import { Score } from "../../model";
import { EditorLayoutDimensions } from "../editor-layout-dimensions";
import {
  calculateMasterBarLayoutMetrics,
  MasterBarLayoutMetrics,
  TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES,
} from "./bar-layout";

/** One finalized master-bar placement shared by every track. */
export type ScoreLayoutBar = {
  finalizedWidth: number;
  masterBarUUID: number;
  masterBarIndex: number;
};

/** One shared wrapped master-bar range. */
export type ScoreLayoutLine = {
  bars: ScoreLayoutBar[];
};

/** Score-wide metrics and wrapped ranges used by every active track. */
export type ScoreLayoutPlan = {
  lines: ScoreLayoutLine[];
  metrics: MasterBarLayoutMetrics[];
};

function finalizeLineBars(
  bars: ScoreLayoutBar[],
  metrics: MasterBarLayoutMetrics[],
  layoutDimensions: EditorLayoutDimensions
): void {
  let structuralWidth = 0;
  let contentMinWidth = 0;
  for (const bar of bars) {
    const metric = metrics[bar.masterBarIndex];
    structuralWidth += metric.structuralWidth;
    contentMinWidth += metric.contentMinWidth;
  }
  const contentScale =
    contentMinWidth === 0
      ? 1
      : Math.max(0, layoutDimensions.WIDTH - structuralWidth) / contentMinWidth;

  for (const bar of bars) {
    const metric = metrics[bar.masterBarIndex];
    bar.finalizedWidth =
      metric.structuralWidth + metric.contentMinWidth * contentScale;
  }
}

/** Owns the current score-wide layout plan for one notation runtime. */
export class ScoreLayoutPlanner {
  private _plan: ScoreLayoutPlan;

  constructor(
    private readonly _score: Score,
    private readonly _layoutDimensions: EditorLayoutDimensions
  ) {
    this._plan = this.calculatePlan();
  }

  /** Calculates the shared width requirements for every score master bar. */
  private calculateMasterBarMetrics(): MasterBarLayoutMetrics[] {
    const metrics: MasterBarLayoutMetrics[] = [];
    for (let i = 0; i < this._score.masterBars.length; i++) {
      let firstMetric: MasterBarLayoutMetrics | undefined;
      let rhythmColumnCount = 0;
      let contentMinWidth = 0;
      for (const track of this._score.tracks) {
        const metric = calculateMasterBarLayoutMetrics(
          track,
          i,
          this._layoutDimensions
        );
        firstMetric ??= metric;
        rhythmColumnCount = Math.max(
          rhythmColumnCount,
          metric.rhythmColumnCount
        );
        contentMinWidth = Math.max(contentMinWidth, metric.contentMinWidth);
      }
      if (firstMetric === undefined) {
        throw Error("Cannot calculate score layout without tracks");
      }

      metrics.push({
        durationFraction: firstMetric.durationFraction,
        rhythmColumnCount,
        contentMinWidth,
        structuralWidth: firstMetric.structuralWidth,
        minWidth: firstMetric.structuralWidth + contentMinWidth,
      });
    }

    return metrics;
  }

  /** Assigns shared master bars to wrapped lines and finalizes their widths. */
  private calculateWrappedLines(
    metrics: MasterBarLayoutMetrics[]
  ): ScoreLayoutLine[] {
    const lines: ScoreLayoutLine[] = [];
    let bars: ScoreLayoutBar[] = [];
    let lineMinWidth = 0;
    let lineDurationWholeNotes = 0;

    for (let i = 0; i < this._score.masterBars.length; i++) {
      const metric = metrics[i];
      const finalizedWidth = Math.min(
        metric.minWidth,
        this._layoutDimensions.WIDTH
      );
      const fitsWidth =
        lineMinWidth + finalizedWidth <= this._layoutDimensions.WIDTH;
      const fitsDuration =
        lineDurationWholeNotes + metric.durationFraction <=
        TRACK_LINE_DURATION_BUDGET_WHOLE_NOTES;

      if (bars.length !== 0 && (!fitsWidth || !fitsDuration)) {
        finalizeLineBars(bars, metrics, this._layoutDimensions);
        lines.push({ bars });
        bars = [];
        lineMinWidth = 0;
        lineDurationWholeNotes = 0;
      }

      bars.push({
        finalizedWidth,
        masterBarUUID: this._score.masterBars[i].uuid,
        masterBarIndex: i,
      });
      lineMinWidth += finalizedWidth;
      lineDurationWholeNotes += metric.durationFraction;
    }

    if (bars.length !== 0) {
      lines.push({ bars });
    }

    return lines;
  }

  /** Calculates shared bar widths and wrapped ranges from the current score. */
  private calculatePlan(): ScoreLayoutPlan {
    const metrics = this.calculateMasterBarMetrics();
    const lines = this.calculateWrappedLines(metrics);
    return { lines, metrics };
  }

  /** Recalculates all shared widths and wrapped master-bar ranges. */
  public rebuild(): void {
    this._plan = this.calculatePlan();
  }

  public get plan(): ScoreLayoutPlan {
    return this._plan;
  }
}
