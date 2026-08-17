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
  contentEndFraction: number;
  masterBarUUID: number;
  masterBarIndex: number;
  x: number;
};

/** One shared wrapped master-bar range. */
export type ScoreLayoutLine = {
  bars: ScoreLayoutBar[];
};

/** Score-wide metrics and placements used by every active track. */
export type ScoreLayoutPlan = {
  metrics: MasterBarLayoutMetrics[];
  wrappedLines: ScoreLayoutLine[];
  intrinsicBars: ScoreLayoutBar[];
};

/** Assigns each bar its horizontal position within one layout line. */
function positionLineBars(bars: ScoreLayoutBar[]): void {
  let x = 0;
  for (const bar of bars) {
    bar.x = x;
    x += bar.finalizedWidth;
  }
}

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
  positionLineBars(bars);
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
      let contentEndFraction = 0;
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
        contentEndFraction = Math.max(
          contentEndFraction,
          metric.contentEndFraction
        );
      }
      if (firstMetric === undefined) {
        throw Error("Cannot calculate score layout without tracks");
      }

      metrics.push({
        durationFraction: firstMetric.durationFraction,
        contentEndFraction,
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
        contentEndFraction: metric.contentEndFraction,
        masterBarUUID: this._score.masterBars[i].uuid,
        masterBarIndex: i,
        x: 0,
      });
      lineMinWidth += finalizedWidth;
      lineDurationWholeNotes += metric.durationFraction;
    }

    if (bars.length !== 0) {
      positionLineBars(bars);
      lines.push({ bars });
    }

    return lines;
  }

  /** Calculates unwrapped intrinsic-width placements for every master bar. */
  private calculateIntrinsicBars(
    metrics: MasterBarLayoutMetrics[]
  ): ScoreLayoutBar[] {
    const bars: ScoreLayoutBar[] = [];
    let x = 0;
    for (let i = 0; i < this._score.masterBars.length; i++) {
      const finalizedWidth = metrics[i].minWidth;
      bars.push({
        finalizedWidth,
        contentEndFraction: metrics[i].contentEndFraction,
        masterBarUUID: this._score.masterBars[i].uuid,
        masterBarIndex: i,
        x,
      });
      x += finalizedWidth;
    }

    return bars;
  }

  /** Calculates shared bar widths, wrapped ranges, and intrinsic placements. */
  private calculatePlan(): ScoreLayoutPlan {
    const metrics = this.calculateMasterBarMetrics();
    const wrappedLines = this.calculateWrappedLines(metrics);
    const intrinsicBars = this.calculateIntrinsicBars(metrics);
    return { metrics, wrappedLines, intrinsicBars };
  }

  /** Recalculates all shared widths and wrapped master-bar ranges. */
  public rebuild(): void {
    this._plan = this.calculatePlan();
  }

  public get plan(): ScoreLayoutPlan {
    return this._plan;
  }
}
