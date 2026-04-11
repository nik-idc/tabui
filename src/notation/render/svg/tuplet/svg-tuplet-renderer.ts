import { Point, createSVGG, createSVGPath, createSVGText } from "@/shared";
import { SVGTupletSegmentRenderer } from "./svg-tuplet-segment-renderer";
import { ElementRenderer } from "../../element-renderer";
import {
  BarTupletGroupElement,
  EditorLayoutDimensions,
  TrackController,
} from "@/notation/controller";

/**
 * Class for rendering a tuplet element using SVG
 */
export class SVGTupletRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Tuplet element */
  tupletElement: BarTupletGroupElement;
  /** Path to any assets */
  readonly assetsPath: string;

  // /** Parent SVG group element */
  // private _parentElement: SVGGElement;

  // /** Rendered segments map */
  // private _renderedTupletSegments: Map<number, SVGTupletSegmentRenderer>;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;
  /** SVG path for if the tuplet is complete */
  private _completeTupletPath?: SVGPathElement;
  /** SVG text for if the tuplet is complete */
  private _completeTupletTextSVG?: SVGTextElement;
  /** SVG texts for if the tuplet is incomplete (text below each beat) */
  private _incompleteTupletTextsSVG?: SVGTextElement[];

  /**
   * Class for rendering a tuplet element using SVG
   * @param trackController Track controller
   * @param tupletElement Tuplet element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    tupletElement: BarTupletGroupElement,
    assetsPath: string
  ) {
    this.trackController = trackController;
    this.tupletElement = tupletElement;

    this.assetsPath = assetsPath;
    // this._parentElement = parentElement;
    //
    // this._renderedTupletSegments = new Map();
  }

  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `tuplet-${tupletUUID}`);
    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  /**
   * Renders the group element which will contain all the data about the tuplet
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  private renderCompleteTupletPath(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    if (this._completeTupletPath === undefined) {
      this._completeTupletPath = createSVGPath();

      // Set only-set-once attributes
      this._completeTupletPath.setAttribute("stroke", "black");
      this._completeTupletPath.setAttribute("stroke-width", "1");
      this._completeTupletPath.setAttribute("fill", "none");

      // Set id
      const id = `tuplet-path-${tupletUUID}`;
      this._completeTupletPath.setAttribute("id", id);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._completeTupletPath);
    }

    const completeRect = this.tupletElement.completePathRectGlobal;
    if (completeRect === undefined) {
      throw Error("Complete rect undefined right before setting SVG path");
    }

    const pathD =
      `M ${completeRect.x} ${completeRect.y} ` +
      `l 0 ${completeRect.height} ` +
      `l ${completeRect.width} 0 l 0 -${completeRect.height}`;
    this._completeTupletPath.setAttribute("d", pathD);
  }

  /**
   * Unender the group
   */
  private unrenderCompleteTupletPath(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender tuplet text when SVG group undefined");
    }

    if (this._completeTupletPath === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._completeTupletPath);
    this._completeTupletPath = undefined;
  }

  /**
   * Render complete-tuplet text
   */
  private renderCompleteTupletText(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    if (this._completeTupletTextSVG === undefined) {
      this._completeTupletTextSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${EditorLayoutDimensions.TEMPO_TEXT_SIZE}`;
      this._completeTupletTextSVG.setAttribute("text-anchor", "middle");
      this._completeTupletTextSVG.setAttribute("dominant-baseline", "middle");
      this._completeTupletTextSVG.setAttribute("font-size", fontSize);

      // Set id
      const id = `tuplet-complete-text-${tupletUUID}`;
      this._completeTupletTextSVG.setAttribute("id", id);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._completeTupletTextSVG);
    }

    const coords = this.tupletElement.comleteTextCoordsGlobal;
    if (coords === undefined) {
      throw Error("Complete text coords undefined right before setting text");
    }

    this._completeTupletTextSVG.setAttribute("x", `${coords.x}`);
    this._completeTupletTextSVG.setAttribute("y", `${coords.y}`);
    this._completeTupletTextSVG.textContent = this.tupletElement.completeText;
  }

  /**
   * Unrender complete-tuplet text
   */
  private unrenderCompleteTupletText(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender tuplet text when SVG group undefined");
    }

    if (this._completeTupletTextSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._completeTupletTextSVG);
    this._completeTupletTextSVG = undefined;
  }

  /**
   * Render incomplete tuplet text
   */
  private renderIncompleteTupletText(index: number): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render tuplet text when SVG group undefined");
    }

    if (this._incompleteTupletTextsSVG === undefined) {
      throw Error("Tried to render tuplet text when text array undefined");
    }

    const tupletUUID = this.tupletElement.tupletGroup.uuid;
    let renderedText = this._incompleteTupletTextsSVG[index];
    if (renderedText === undefined) {
      this._incompleteTupletTextsSVG[index] = createSVGText();
      renderedText = this._incompleteTupletTextsSVG[index];

      // Set only-set-once attributes
      const fontSize = `${EditorLayoutDimensions.TEMPO_TEXT_SIZE}`;
      renderedText.setAttribute("text-anchor", "middle");
      renderedText.setAttribute("dominant-baseline", "middle");
      renderedText.setAttribute("font-size", fontSize);

      // Set id
      const id = `tuplet-incomplete-text-${index}-${tupletUUID}`;
      renderedText.setAttribute("id", id);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(renderedText);
    }

    const textCoordsArray = this.tupletElement.incompleteTextsCoordsGlobal;
    if (textCoordsArray === undefined) {
      throw Error("Incomplete text array undefined right before setting text");
    }
    const coords = textCoordsArray[index];
    if (coords === undefined) {
      throw Error("Incomplete text coords undefined right before setting text");
    }

    renderedText.setAttribute("x", `${coords.x}`);
    renderedText.setAttribute("y", `${coords.y}`);
    renderedText.textContent = this.tupletElement.getTupletString(index);
  }

  /**
   * Unrender incomplete tuplet text
   * @param index Index of the tuplet text
   */
  private unrenderIncompleteTupletText(index: number): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender tuplet text when SVG group undefined");
    }

    if (this._incompleteTupletTextsSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._incompleteTupletTextsSVG[index]);
  }

  /**
   * Renders all incomplete texts
   */
  private renderIncompleteTexts(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render duration flags when SVG group undefined");
    }

    if (this.tupletElement.tupletGroup.complete) {
      throw Error("Tried to render incomplete texts when tuplet is complete");
    }

    if (this._incompleteTupletTextsSVG === undefined) {
      this._incompleteTupletTextsSVG = [];
    }

    const length = this.tupletElement.tupletGroup.beats.length;
    while (this._incompleteTupletTextsSVG.length > length) {
      this.unrenderIncompleteTupletText(
        this._incompleteTupletTextsSVG.length - 1
      );
      this._incompleteTupletTextsSVG.pop();
    }

    for (let i = 0; i < length; i++) {
      this.renderIncompleteTupletText(i);
    }
  }

  /**
   * Unrenders all incomplete texts
   */
  private unrenderIncompleteTexts(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender duration flags when SVG group undefined");
    }

    const length = this.tupletElement.tupletGroup.beats.length;
    for (let i = 0; i < length; i++) {
      this.unrenderIncompleteTupletText(i);
    }
    this._incompleteTupletTextsSVG = undefined;
  }

  /**
   * Render tuplet using SVG
   * @returns Active renderers
   */
  public render(): void {
    this.renderGroup();

    if (this.tupletElement.tupletGroup.complete) {
      this.unrenderIncompleteTexts();

      this.renderCompleteTupletText();
      this.renderCompleteTupletPath();
    } else {
      this.unrenderCompleteTupletText();
      this.unrenderCompleteTupletPath();

      this.renderIncompleteTexts();
    }
  }

  /**
   * Unrender tuplet
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.unrenderCompleteTupletText();
    this.unrenderCompleteTupletPath();
    this.unrenderIncompleteTexts();

    // this._parentElement.removeChild(this._containerGroupSVG);
    // this._containerGroupSVG = undefined;
  }
}

// ================
// ==== LEGACY ====
//
// /**
//  * Render tuplet segments
//  */
// private renderTupletSegments(): SVGTupletSegmentRenderer[] {
//   if (this._containerGroupSVG === undefined) {
//     throw Error("Tried to render tuplet segments when SVG group undefined");
//   }

//   const activeRenderers: SVGTupletSegmentRenderer[] = [];

//   // Check if there are any beat element to remove
//   const curBeatElementUUIDs = new Set(
//     this.tupletElement.beatElements.map((b) => b.beat.uuid)
//   );
//   for (const [uuid, renderer] of this._renderedTupletSegments) {
//     if (!curBeatElementUUIDs.has(uuid)) {
//       renderer.unrender();
//       this._renderedTupletSegments.delete(uuid);
//     }
//   }

//   // Add & render new tuplet segments AND re-render existing ones
//   for (const beatElement of this.tupletElement.beatElements) {
//     const renderedTupletSegment = this._renderedTupletSegments.get(
//       beatElement.beat.uuid
//     );
//     if (renderedTupletSegment === undefined) {
//       const renderer = new SVGTupletSegmentRenderer(
//         this.trackController,
//         beatElement,
//         this.assetsPath,
//         this._containerGroupSVG
//       );
//       renderer.render(
//         this.tupletElement.tupletGroup.complete,
//         this.tupletElement.tupletGroup.isStandard
//       );
//       activeRenderers.push(renderer);
//       this._renderedTupletSegments.set(beatElement.beat.uuid, renderer);
//     } else {
//       renderedTupletSegment.render(
//         this.tupletElement.tupletGroup.complete,
//         this.tupletElement.tupletGroup.isStandard
//       );
//       activeRenderers.push(renderedTupletSegment);
//     }
//   }
//   return activeRenderers;
// }

// /**
//  * Unrender tuplet segments
//  */
// private unrenderTupletSegments(): void {
//   if (this._containerGroupSVG === undefined) {
//     throw Error("Tried to unrender tuplet segments when SVG group undefined");
//   }

//   for (const [uuid, renderer] of this._renderedTupletSegments) {
//     renderer.unrender();
//     this._renderedTupletSegments.delete(uuid);
//   }
// }
// ==== LEGACY ====
// ================
