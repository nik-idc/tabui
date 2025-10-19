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
   * Set all values in one function
   * @param newX New X value
   * @param newY New Y value
   * @param newWidth New width value
   * @param newHeight New height value
   */
  public set(
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ): void {
    this.x = newX;
    this.y = newY;
    this.width = newWidth;
    this.height = newHeight;
  }

  /**
   * Set coords in one function
   * @param newX New X value
   * @param newY New Y value
   */
  public setCoords(newX: number, newY: number): void {
    this.x = newX;
    this.y = newY;
  }

  /**
   * Set dimensions in one function
   * @param newWidth New width value
   * @param newHeight New height value
   */
  public setDimensions(newWidth: number, newHeight: number): void {
    this.width = newWidth;
    this.height = newHeight;
  }

  /**
   * Reset all values to 0
   */
  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Returns the leftmost X coordinate
   */
  public get left(): number {
    return this.x;
  }

  /**
   * Returns the rightmost X coordinate
   */
  public get right(): number {
    return this.x + this.width;
  }

  /**
   * Returns the top Y coordinate
   */
  public get top(): number {
    return this.y;
  }

  /**
   * Returns the bottom Y coordinate
   */
  public get bottom(): number {
    return this.y + this.height;
  }

  public get middleX(): number {
    return this.x + this.width / 2;
  }

  public get middleY(): number {
    return this.y + this.height / 2;
  }

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

  public get middle(): Point {
    return new Point(this.middleX, this.middleY);
  }
}
