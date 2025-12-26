/**
 * Basic point class
 */
export class Point {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  /**
   * Sets point's coordinates
   * @param newX New X coordinate
   * @param newY New Y coordinate
   */
  public set(newX: number, newY: number): void {
    this.x = newX;
    this.y = newY;
  }
}
