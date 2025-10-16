import { Point } from "./point";
/**
 * Basic rectangle class
 */
export class Rect {
    x;
    y;
    width;
    height;
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    /**
     * Returns a point with left top corner coords
     */
    get leftTop() {
        return new Point(this.x, this.y);
    }
    /**
     * Returns a point with left bottom corner coords
     */
    get leftBottom() {
        return new Point(this.x, this.y + this.height);
    }
    /**
     * Returns a point with right top corner coords
     */
    get rightTop() {
        return new Point(this.x + this.width, this.y);
    }
    /**
     * Returns a point with right bottom corner coords
     */
    get rightBottom() {
        return new Point(this.x + this.width, this.y + this.height);
    }
}
//# sourceMappingURL=rect.js.map