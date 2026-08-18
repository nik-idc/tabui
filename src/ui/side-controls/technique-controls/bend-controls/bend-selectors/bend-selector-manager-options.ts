export interface BendSelectorManagerOptions {
  /** Total width of the SVG (labels + grid) */
  width: number;
  /** Total height of the SVG */
  height: number;
  /** X-offset for lines to accommodate text before the grid */
  gridOffset: number;
  /** Number of rows in the grid */
  rowsCount: number;
  /** Number of cols in the grid */
  colsCount: number;
}
