/**
 * Basic line class
 */
export class Line {
  constructor(
    public x1: number = 0,
    public y1: number = 0,
    public x2: number = 0,
    public y2: number = 0
  ) {}

  public set(
    x1: number = 0,
    y1: number = 0,
    x2: number = 0,
    y2: number = 0
  ): void {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }
}

/**
 * Basic horizontal line class
 */
export class HorLine {
  constructor(
    public x1: number = 0,
    public x2: number = 0,
    public y: number = 0
  ) {}

  public set(x1: number = 0, x2: number = 0, y: number = 0): void {
    this.x1 = x1;
    this.x2 = x2;
    this.y = y;
  }
}

/**
 * Basic vertical line class
 */
export class VertLine {
  public x: number = 0;
  public y1: number = 0;
  public y2: number = 0;

  /**
   * Basic vertical line class
   * @param x X coordinate
   * @param y1 Top coordinate
   * @param y2 Bottom coordinate
   */
  constructor(x: number = 0, y1: number = 0, y2: number = 0) {
    this.x = x;
    this.y1 = y1;
    this.y2 = y2;
  }

  public set(x: number = 0, y1: number = 0, y2: number = 0): void {
    this.x = x;
    this.y1 = y1;
    this.y2 = y2;
  }

  /**
   * Sets the top to the new Y & adjusts the bottom
   * @param newY
   */
  public setY(newY: number): void {
    const height = this.y2 - this.y1;
    this.y1 = newY;
    this.y2 = this.y1 + height;
  }

  /** Line height */
  public get height(): number {
    return this.y2 - this.y1;
  }
}
