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

  public static createHorizontalVibratoPath(
    x: number,
    y: number,
    height: number,
    width: number
  ): SVGPathDescriptor {
    const edgeWidth = width / 8;
    // Start at the vertical middle to make the humps symmetrical
    const startY = y + height / 2;

    const d =
      `M ${x} ${startY} ` +
      // q [controlX] [controlY] [endX] [endY]
      `q ${edgeWidth / 2} ${-height} ${edgeWidth} 0 ` + // Upward hump
      `t ${edgeWidth} 0 ` + // Smooth shorthand (Automatic reflection)
      `t ${edgeWidth} 0 ` +
      `t ${edgeWidth} 0 ` +
      `t ${edgeWidth} 0 ` +
      `t ${edgeWidth} 0 ` +
      `t ${edgeWidth} 0 ` +
      `t ${edgeWidth} 0 `;

    return {
      d,
      attrs: {
        stroke: "var(--tu-notation-ink)",
        fill: "none",
        strokeLinecap: "round", // Makes the ends look professional
        "stroke-width": "1.5", // Vibrato usually needs a bit of weight
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
