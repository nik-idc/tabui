/**
 * Class that handles effects and their labels' HTMLs
 */
export declare class SVGUtils {
    /**
     * Width of an arrow (applicable to bends)
     */
    readonly arrowWidth: number;
    /**
     * Height of an arrow (applicable to bends)
     */
    readonly arrowHeight: number;
    /**
     * Builds a full HTML SVG path of a vertical arrow
     * @param dx Distance to move by initially on the X-axis
     * @param dy Distance to move by initially on the Y-axis
     * @param pointTop True if arrow points up, false otherwise. Defaults to true
     * @returns A full HTML SVG path of a vertical arrow
     */
    verticalArrowSVGHTML(dx: number, dy: number, pointTop?: boolean): string;
    /**
     * Builds a path for an up aimed curve (used for bends)
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param verticalOffset Vertical distance to the top string line
     * @returns Constructed SVG path HTML element
     */
    upCurveSVGHTML(dx: number, dy: number, width: number, verticalOffset: number): string;
    /**
     * Builds a path for a down aimed curve (used for bends)
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param height Height for the curve building
     * @param verticalOffset Vertical distance to the top string line
     * @returns Constructed SVG path HTML element
     */
    downCurveSVGHTML(dx: number, dy: number, width: number, height: number, verticalOffset: number): string;
    /**
     * Builds a path for a horizontal curve (used for hammer-ons/pull-offs)
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param height Height for the curve building
     * @returns Constructed SVG path HTML element
     */
    horizontalCurveSVGHTML(dx: number, dy: number, width: number, height: number): string;
    /**
     * Builds a regular straight line
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param height Height of the line
     * @param pointTop Where should the line point to, i.e. where to draw: up or down
     * @returns Constructed SVG path HTML element
     */
    vertLineSVGHTML(dx: number, dy: number, height: number, pointTop?: boolean): string;
    /**
     * Builds a straight line
     * @param dx1 Point 1 X (start)
     * @param dy1 Point 1 Y (start)
     * @param dx2 Point 2 X (end)
     * @param dy2 Point 2 Y (end)
     * @returns Constructed SVG path HTML element
     */
    lineSVGHTML(dx1: number, dy1: number, dx2: number, dy2: number): string;
    /**
     * Builds a harmonic shape
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param height Height for the curve building
     * @param fill True if the shape should be filled, false otherwise
     * @returns Constructed SVG path HTML element
     */
    harmonicShapeSVGHTML(dx: number, dy: number, width: number, height: number, fill: boolean): string;
    /**
     * Builds an SVG HTML ratio
     * @param wholePart Whole part of the ratio
     * @param topNum Top number
     * @param bottomNum Bottom number
     * @param x Desired top-left X coordinate
     * @param y Desired top-left Y coordinate
     * @param bigNumSize Size of the whole part number
     * @returns SVG HTML of a ratio
     */
    ratioSVGHTML(wholePart: number, topNum: number, bottomNum: number, x: number, y: number, bigNumSize: number): string;
    /**
     * Generates a horizontal squiggly line
     * @param x X coordinate
     * @param y Y coordinate
     * @param height Height
     * @param width Width
     * @returns Squiggly SVG HTMLА
     */
    horizontalSquigglySVGHTML(x: number, y: number, height: number, width: number): string;
    /**
     * Generates SVG HTML text
     * @param x X coordinate
     * @param y Y coordinate
     * @param fontSize Font size
     * @param text Text to display
     * @returns SVG HTML of the specified text
     */
    textSVGHTML(x: number, y: number, fontSize: number, text: string): string;
}
