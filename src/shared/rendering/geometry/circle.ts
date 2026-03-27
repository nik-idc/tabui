/**
 * Basic circle class
 */
export class Circle {
  constructor(
    public centerX: number = 0,
    public centerY: number = 0,
    public diameter: number = 0
  ) {}

  /**
   * Sets circle's values
   * @param newCenterX New center X coordinate
   * @param newCenterY New center Y coordinate
   * @param newDiameter New circle diameter
   */
  public set(
    newCenterX: number,
    newCenterY: number,
    newDiameter: number
  ): void {
    this.centerX = newCenterX;
    this.centerY = newCenterY;
    this.diameter = newDiameter;
  }

  /**
   * Sets circle's coordinates
   * @param newCenterX New center X coordinate
   * @param newCenterY New center Y coordinate
   */
  public setCoords(newCenterX: number, newCenterY: number): void {
    this.centerX = newCenterX;
    this.centerY = newCenterY;
  }

  /** X coordinate of the right-most point of the circle */
  public get right(): number {
    return this.centerX + this.diameter / 2;
  }
}
