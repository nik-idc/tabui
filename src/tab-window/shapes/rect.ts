import { Point } from "./point";

/**
 * Basic rectangle class
 */
export class Rect {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0
  ) {}

  /**
   * Returns a point with left top corner coords
   */
  public get leftTop(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Returns a point with left bottom corner coords
   */
  public get leftBottom(): Point {
    return new Point(this.x, this.y + this.height);
  }

  /**
   * Returns a point with right top corner coords
   */
  public get rightTop(): Point {
    return new Point(this.x + this.width, this.y);
  }

  /**
   * Returns a point with right bottom corner coords
   */
  public get rightBottom(): Point {
    return new Point(this.x + this.width, this.y + this.height);
  }
}
