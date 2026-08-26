import { SVGPathDescriptor, SVGTextDescriptor } from "../technique-element";

/**
 * Builder utilities for guitar technique SVG descriptors and label markup.
 */
export class GuitarTechniqueDescriptors {
  static readonly arrowWidth: number = 5;
  static readonly arrowHeight: number = 8;

  private static readonly DEFAULT_STROKE_ATTRS = {
    stroke: "var(--tu-notation-ink)",
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  } satisfies Record<string, string>;

  public static createVerticalArrowPath(
    dx: number,
    dy: number,
    pointTop: boolean = true
  ): SVGPathDescriptor {
    const topCoef = pointTop ? 1 : -1;

    return {
      d:
        `m ${dx} ${dy}` +
        ` l ${this.arrowWidth / 2} 0` +
        ` l -${this.arrowWidth / 2} ${(this.arrowHeight / 2) * -1 * topCoef}` +
        ` l -${this.arrowWidth / 2} ${(this.arrowHeight / 2) * topCoef}` +
        ` l ${this.arrowWidth / 2} 0`,
      attrs: {
        ...this.DEFAULT_STROKE_ATTRS,
        fill: "var(--tu-notation-ink)",
      },
    };
  }

  public static createUpCurvePath(
    dx: number,
    dy: number,
    width: number,
    verticalOffset: number
  ): SVGPathDescriptor {
    const curveBeginX = dx + width;
    const curveBeginY = dy;
    const curveMiddleX = curveBeginX;
    const curveMiddleY = dy - verticalOffset;

    return {
      d:
        `m ${dx} ${dy} ` +
        `C ${curveBeginX} ${curveBeginY} ` +
        `${curveMiddleX} ${curveMiddleY} ` +
        `${curveMiddleX} ${curveMiddleY}`,
      attrs: this.DEFAULT_STROKE_ATTRS,
    };
  }

  public static createDownCurvePath(
    dx: number,
    dy: number,
    width: number,
    height: number,
    verticalOffset: number
  ): SVGPathDescriptor {
    const curveBeginX = dx + width;
    const curveBeginY = dy - height;
    const curveMiddleX = curveBeginX;
    const curveMiddleY = curveBeginY + verticalOffset;
    const curveEndX = curveMiddleX;
    const curveEndY = curveMiddleY + height;

    return {
      d:
        `m ${dx} ${dy} ` +
        `C ${curveBeginX} ${curveBeginY} ` +
        `${curveMiddleX} ${curveMiddleY} ` +
        `${curveEndX} ${curveEndY}`,
      attrs: this.DEFAULT_STROKE_ATTRS,
    };
  }

  public static createHorizontalCurvePath(
    dx: number,
    dy: number,
    width: number,
    height: number
  ): SVGPathDescriptor {
    const curveBeginX = dx;
    const curveBeginY = dy - height;
    const curveMiddleX = curveBeginX + width;
    const curveMiddleY = curveBeginY;
    const curveEndX = curveMiddleX;
    const curveEndY = curveMiddleY + height;

    return {
      d:
        `m ${dx} ${dy} ` +
        `C ${curveBeginX} ${curveBeginY} ` +
        `${curveMiddleX} ${curveMiddleY} ` +
        `${curveEndX} ${curveEndY}`,
      attrs: this.DEFAULT_STROKE_ATTRS,
    };
  }

  public static createVerticalLinePath(
    dx: number,
    dy: number,
    height: number,
    pointTop: boolean = true
  ): SVGPathDescriptor {
    const topCoef = pointTop ? -1 : 1;

    return {
      d: `m ${dx} ${dy} l 0 ${height * topCoef}`,
      attrs: this.DEFAULT_STROKE_ATTRS,
    };
  }

  public static createLinePath(
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number
  ): SVGPathDescriptor {
    return {
      d: `m ${dx1} ${dy1} L ${dx2} ${dy2}`,
      attrs: this.DEFAULT_STROKE_ATTRS,
    };
  }

  public static createHarmonicDiamondPath(
    dx: number,
    dy: number,
    width: number,
    height: number,
    fill: boolean
  ): SVGPathDescriptor {
    const line1X = dx + width / 2;
    const line1Y = dy - height / 2;
    const line2X = line1X + width / 2;
    const line2Y = line1Y + height / 2;
    const line3X = line2X - width / 2;
    const line3Y = line2Y + height / 2;
    const line4X = line3X - width / 2;
    const line4Y = line3Y - height / 2;

    return {
      d:
        `m ${dx} ${dy} ` +
        `L ${line1X} ${line1Y} ` +
        `L ${line2X} ${line2Y} ` +
        `L ${line3X} ${line3Y} ` +
        `L ${line4X} ${line4Y} Z`,
      attrs: {
        ...this.DEFAULT_STROKE_ATTRS,
        fill: fill ? "var(--tu-notation-ink)" : "none",
      },
    };
  }

  /**
   * Builds one beat's section of a fixed-size track-line wave.
   * Cubic controls make adjacent beat sections join smoothly.
   */
  public static createHorizontalVibratoPath(
    x: number,
    y: number,
    height: number,
    width: number,
    lineStartX: number
  ): SVGPathDescriptor {
    const curvePartWidth = height / 2;
    const halfHeight = height / 2;
    const radiansPerPixel = Math.PI / (2 * curvePartWidth);
    const centerY = y + halfHeight;

    const lineEndX = lineStartX + width;
    const splitPoints = [lineStartX];
    const initSplitX =
      (Math.floor(lineStartX / curvePartWidth) + 1) * curvePartWidth;
    for (let splitX = initSplitX; splitX < lineEndX; splitX += curvePartWidth) {
      splitPoints.push(splitX);
    }
    splitPoints.push(lineEndX);

    const ys: number[] = [];
    const tangentSlopes: number[] = [];
    for (let i = 0; i < splitPoints.length; i++) {
      const angle = splitPoints[i] * radiansPerPixel;
      ys.push(centerY - halfHeight * Math.sin(angle));
      tangentSlopes.push(-halfHeight * radiansPerPixel * Math.cos(angle));
    }

    let localX = x;
    const commands = [`M ${localX} ${ys[0]}`];
    for (let i = 1; i < splitPoints.length; i++) {
      const partWidth = splitPoints[i] - splitPoints[i - 1];
      const localStartX = localX;
      localX += partWidth;

      const control1X = localStartX + partWidth / 3;
      const control1Y = ys[i - 1] + (tangentSlopes[i - 1] * partWidth) / 3;
      const control2X = localX - partWidth / 3;
      const control2Y = ys[i] - (tangentSlopes[i] * partWidth) / 3;
      const endX = localX;
      const endY = ys[i];

      const controlPointsSegment = `${control1X} ${control1Y} ${control2X} ${control2Y}`;
      const endPointSegment = `${endX} ${endY}`;
      commands.push(`C ${controlPointsSegment} ${endPointSegment}`);
    }

    return {
      d: commands.join(" "),
      attrs: {
        stroke: "var(--tu-notation-ink)",
        fill: "none",
        "stroke-linecap": "round",
        "stroke-width": "1.5",
      },
    };
  }

  public static createTextDescriptor(
    x: number,
    y: number,
    fontSize: number,
    text: string,
    textWidth?: number
  ): SVGTextDescriptor {
    let textAttrs: { textLength: string; lengthAdjust: string } | {};
    if (textWidth !== undefined) {
      textAttrs = {
        textLength: `${textWidth}`,
        lengthAdjust: "spacingAndGlyphs",
      };
    } else {
      textAttrs = {};
    }

    return {
      text,
      attrs: {
        x: `${x}`,
        y: `${y}`,
        "font-size": `${fontSize}`,
        "font-weight": "bold",
        "font-style": "italic",
        "text-anchor": "middle",
        "dominant-baseline": "hanging",
        fill: "var(--tu-notation-text)",
        ...textAttrs,
      },
    };
  }
}
