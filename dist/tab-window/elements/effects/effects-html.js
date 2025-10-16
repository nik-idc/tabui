/**
 * Class that handles effects and their labels' HTMLs
 */
export class SVGUtils {
    /**
     * Width of an arrow (applicable to bends)
     */
    arrowWidth = 5;
    /**
     * Height of an arrow (applicable to bends)
     */
    arrowHeight = 8;
    /**
     * Builds a full HTML SVG path of a vertical arrow
     * @param dx Distance to move by initially on the X-axis
     * @param dy Distance to move by initially on the Y-axis
     * @param pointTop True if arrow points up, false otherwise. Defaults to true
     * @returns A full HTML SVG path of a vertical arrow
     */
    verticalArrowSVGHTML(dx, dy, pointTop = true) {
        const topCoef = pointTop ? 1 : -1;
        return (
        // Path opening tag #2
        ' <path d="' +
            // Arrow
            `m ${dx} ${dy}` +
            ` l ${this.arrowWidth / 2} 0` +
            ` l -${this.arrowWidth / 2} ${(this.arrowHeight / 2) * -1 * topCoef}` +
            ` l -${this.arrowWidth / 2} ${(this.arrowHeight / 2) * topCoef}` +
            ` l ${this.arrowWidth / 2} 0` +
            '" stroke="black" fill="black"/>');
    }
    /**
     * Builds a path for an up aimed curve (used for bends)
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param verticalOffset Vertical distance to the top string line
     * @returns Constructed SVG path HTML element
     */
    upCurveSVGHTML(dx, dy, width, verticalOffset) {
        // const curveBeginX = dx + this._noteRect.width / 2;
        const curveBeginX = dx + width;
        const curveBeginY = dy;
        const curveMiddleX = curveBeginX;
        const curveMiddleY = dy - verticalOffset;
        const curveEndX = curveMiddleX;
        const curveEndY = curveMiddleY;
        return (
        // Path opening tag
        '<path d="' +
            // Bend curve
            `m ${dx} ${dy} ` +
            ` C ${curveBeginX} ${curveBeginY}` +
            ` ${curveMiddleX} ${curveMiddleY}` +
            ` ${curveEndX} ${curveEndY}` +
            // Bend styling & tag close
            '" stroke="black" fill="transparent"/>');
    }
    /**
     * Builds a path for a down aimed curve (used for bends)
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param height Height for the curve building
     * @param verticalOffset Vertical distance to the top string line
     * @returns Constructed SVG path HTML element
     */
    downCurveSVGHTML(dx, dy, width, height, verticalOffset) {
        const curveBeginX = dx + width;
        const curveBeginY = dy - height;
        const curveMiddleX = curveBeginX;
        const curveMiddleY = curveBeginY + verticalOffset;
        const curveEndX = curveMiddleX;
        const curveEndY = curveMiddleY + height;
        return ('<path d="' +
            `m ${dx} ${dy} ` +
            ` C ${curveBeginX} ${curveBeginY} ` +
            ` ${curveMiddleX} ${curveMiddleY} ` +
            ` ${curveEndX} ${curveEndY}` +
            // Bend styling & tag close
            '" stroke="black" fill="transparent"/>');
    }
    /**
     * Builds a path for a horizontal curve (used for hammer-ons/pull-offs)
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param height Height for the curve building
     * @returns Constructed SVG path HTML element
     */
    horizontalCurveSVGHTML(dx, dy, width, height) {
        const curveBeginX = dx;
        const curveBeginY = dy - height;
        const curveMiddleX = curveBeginX + width;
        const curveMiddleY = curveBeginY;
        const curveEndX = curveMiddleX;
        const curveEndY = curveMiddleY + height;
        return ('<path d="' +
            `m ${dx} ${dy} ` +
            ` C ${curveBeginX} ${curveBeginY} ` +
            ` ${curveMiddleX} ${curveMiddleY} ` +
            ` ${curveEndX} ${curveEndY}` +
            '" stroke="black" fill="transparent"/>');
    }
    /**
     * Builds a regular straight line
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param height Height of the line
     * @param pointTop Where should the line point to, i.e. where to draw: up or down
     * @returns Constructed SVG path HTML element
     */
    vertLineSVGHTML(dx, dy, height, pointTop = true) {
        const topCoef = pointTop ? -1 : 1;
        return ('<path d="' +
            `m ${dx} ${dy} ` +
            ` l 0 ${height * topCoef}` +
            '" stroke="black" fill="transparent"/>');
    }
    /**
     * Builds a straight line
     * @param dx1 Point 1 X (start)
     * @param dy1 Point 1 Y (start)
     * @param dx2 Point 2 X (end)
     * @param dy2 Point 2 Y (end)
     * @returns Constructed SVG path HTML element
     */
    lineSVGHTML(dx1, dy1, dx2, dy2) {
        return ('<path d="' +
            `m ${dx1} ${dy1} ` +
            `L ${dx2} ${dy2} ` +
            '" stroke="black" fill="transparent" stroke-linecap="round"/>');
    }
    /**
     * Builds a harmonic shape
     * @param dx How much to move on the X-axis prior to building
     * @param dy How much to move on the Y-axis prior to building
     * @param width Width of the effect
     * @param height Height for the curve building
     * @param fill True if the shape should be filled, false otherwise
     * @returns Constructed SVG path HTML element
     */
    harmonicShapeSVGHTML(dx, dy, width, height, fill) {
        const line1X = dx + width / 2;
        const line1Y = dy - height / 2;
        const line2X = line1X + width / 2;
        const line2Y = line1Y + height / 2;
        const line3X = line2X - width / 2;
        const line3Y = line2Y + height / 2;
        const line4X = line3X - width / 2;
        const line4Y = line3Y - height / 2;
        const fillColor = fill ? "black" : "transparent";
        return ('<path d="' +
            `m ${dx} ${dy} ` +
            ` L ${line1X} ${line1Y} ` +
            ` L ${line2X} ${line2Y} ` +
            ` L ${line3X} ${line3Y} ` +
            ` L ${line4X} ${line4Y}` +
            `" stroke="black" fill="${fillColor}"/>`);
    }
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
    ratioSVGHTML(wholePart, topNum, bottomNum, x, y, bigNumSize) {
        const numSize = bigNumSize / 2;
        let wholePartX = 0;
        let wholePartY = 0;
        let wholePartHTML = "";
        if (wholePart !== 0) {
            wholePartX = x;
            wholePartY = y;
            wholePartHTML = `<text x="${wholePartX}"
                             y="${wholePartY}"
                             font-size="${bigNumSize}"
                             text-anchor="start"
                             dominant-baseline="hanging"
                             fill="black">
                              ${wholePart}
                        </text>`;
        }
        const topNumX = wholePartX === 0 ? x + bigNumSize / 2 : wholePartX + bigNumSize / 2;
        const topNumY = y;
        const bottomNumX = topNumX + numSize;
        const bottomNumY = y + bigNumSize / 2;
        const lineX1 = topNumX;
        const lineY1 = y + bigNumSize;
        const lineX2 = bottomNumX + numSize / 2;
        const lineY2 = y;
        const ratioSVGHTML = `<text x="${topNumX}"
                             y="${topNumY}"
                             font-size="${numSize}"
                             text-anchor="start"
                             dominant-baseline="hanging"
                             fill="black">
                               ${topNum}
                       </text>
                       <line x1="${lineX1}"
                             y1="${lineY1}"
                             x2="${lineX2}"
                             y2="${lineY2}"
                             stroke="black"/>
                       <text x="${bottomNumX}"
                             y="${bottomNumY}"
                             font-size="${numSize}"
                             text-anchor="start"
                             dominant-baseline="hanging"
                             fill="black">
                               ${bottomNum}
                       </text>`;
        return wholePartHTML + ratioSVGHTML;
    }
    /**
     * Generates a horizontal squiggly line
     * @param x X coordinate
     * @param y Y coordinate
     * @param height Height
     * @param width Width
     * @returns Squiggly SVG HTMLА
     */
    horizontalSquigglySVGHTML(x, y, height, width) {
        const edgeWidth = width / 8;
        return ('<path d="' +
            `M ${x} ${y + height} ` +
            `l ${edgeWidth} ${-height} ` +
            `l ${edgeWidth} ${height} ` +
            `l ${edgeWidth} ${-height} ` +
            `l ${edgeWidth} ${height} ` +
            `l ${edgeWidth} ${-height} ` +
            `l ${edgeWidth} ${height} ` +
            `l ${edgeWidth} ${-height} ` +
            `l ${edgeWidth} ${height}` +
            '" stroke="black" fill="transparent"/>');
    }
    /**
     * Generates SVG HTML text
     * @param x X coordinate
     * @param y Y coordinate
     * @param fontSize Font size
     * @param text Text to display
     * @returns SVG HTML of the specified text
     */
    textSVGHTML(x, y, fontSize, text) {
        return `<text x="${x}"
                  y="${y}"
                  font-size="${fontSize}"
                  text-anchor="start"
                  dominant-baseline="hanging">
                      ${text}
            </text>`;
    }
}
//# sourceMappingURL=effects-html.js.map