import { Point } from "./point";
/**
 * Basic rectangle class
 */
export declare class Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x?: number, y?: number, width?: number, height?: number);
    /**
     * Returns a point with left top corner coords
     */
    get leftTop(): Point;
    /**
     * Returns a point with left bottom corner coords
     */
    get leftBottom(): Point;
    /**
     * Returns a point with right top corner coords
     */
    get rightTop(): Point;
    /**
     * Returns a point with right bottom corner coords
     */
    get rightBottom(): Point;
}
