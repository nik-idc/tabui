import {
  BeatGuitarTechnique,
  BeatGuitarTechniqueType,
  StrokeDirection,
  VoiceNumber,
} from "../../../../model";
import { Point, Rect, randomInt } from "../../../../../shared";
import { EditorLayoutDimensions } from "../../../editor-layout-dimensions";
import { GuitarTechniqueDescriptors } from "../guitar-technique/guitar-technique-descriptors";
import { NotationElement, NotationNodeType } from "../../notation-element";
import { TrackElement } from "../../track-element";
import { SVGPathDescriptor, TechniquePathElement } from "../technique-element";
import type { TabBeatElement } from "../../beat/tab-beat-element";
import type { BarElement } from "../../bar/bar-element";
import type { TrackLineElement } from "../../track/track-line-element";

/**
 * Geometry and SVG paths of a guitar technique owned by a whole tab beat.
 * It draws inside the beat's reserved technique slot, at the left edge of
 * the beat box, so it never changes the beat width.
 */
export class BeatGuitarTechniqueElement implements TechniquePathElement {
  /** Identity of the beat and type, so undo, which copies techniques, keeps one renderer. */
  public static createStableIdentity(
    beatElement: TabBeatElement,
    type: BeatGuitarTechniqueType
  ): string {
    return `beat-technique:${beatElement.beat.uuid}:${type}`;
  }

  /** Beat-local x of the stroke line: the center of the reserved slot. */
  public static getStrokeLineX(
    layoutDimensions: EditorLayoutDimensions
  ): number {
    return layoutDimensions.beatTechniqueWidth / 2;
  }

  /**
   * Beat-local x where beat technique visuals start. Note visuals that come
   * from the left, such as note transitions, end before it.
   */
  public static getVisualX(layoutDimensions: EditorLayoutDimensions): number {
    return (
      BeatGuitarTechniqueElement.getStrokeLineX(layoutDimensions) -
      GuitarTechniqueDescriptors.arrowWidth / 2
    );
  }

  /** Identifies this notation element's node type */
  readonly nodeType = NotationNodeType.Element;
  /** Element's unique identifier */
  readonly uuid: number;
  /** Owning beat element */
  readonly beatElement: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Current model technique; undo and redo replace the object for the same beat and type. */
  private _technique: BeatGuitarTechnique;
  /** Beat-local bounds of the drawn visual. */
  private _boundingBox: Rect;
  /** SVG paths in beat-local coordinates. */
  private _pathDescriptors: SVGPathDescriptor[];

  /**
   * Creates the element for a beat technique.
   * @param technique Beat technique
   * @param beatElement Owning tab beat element
   */
  constructor(technique: BeatGuitarTechnique, beatElement: TabBeatElement) {
    this.uuid = randomInt();
    this._technique = technique;
    this.beatElement = beatElement;
    this.trackElement = beatElement.trackElement;
    this._boundingBox = new Rect();
    this._pathDescriptors = [];
  }

  public get voiceNumber(): VoiceNumber {
    return this.beatElement.voiceNumber;
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.beatElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.beatElement.barElement;
  }

  /** Current model technique. */
  public get technique(): BeatGuitarTechnique {
    return this._technique;
  }

  /** Replaces the model technique after a rebuild, keeping this element's identity. */
  public setTechnique(technique: BeatGuitarTechnique): void {
    this._technique = technique;
  }

  /** Beat techniques have no child nodes to build. */
  public build(): void {}

  /** Size depends on note slot positions, so it is set in layout. */
  public measure(): void {}

  /** Positions the visual and builds its paths; note slots must be laid out first. */
  public layout(): void {
    switch (this._technique.type) {
      case BeatGuitarTechniqueType.Stroke:
        this.layoutStroke();
        return;
      default: {
        const unknownType: never = this._technique.type;
        throw Error(`Unknown beat technique type: ${unknownType}`);
      }
    }
  }

  /**
   * Draws a vertical line with an arrowhead across every string, so all
   * strokes have the same height. String 1 is the top tab line, so a down
   * stroke, which ends on string 1, points up.
   */
  private layoutStroke(): void {
    const options = this._technique.options;
    const layoutDimensions = this.trackElement.layoutDimensions;
    const slots = this.beatElement.noteElements;
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    if (firstSlot === undefined || lastSlot === undefined) {
      this._boundingBox = new Rect();
      this._pathDescriptors = [];
      return;
    }

    // Inset the ends, so strokes on adjacent slots of other beats stay apart.
    const inset = layoutDimensions.noteRectHeight / 8;
    const topY = firstSlot.boundingBox.y + inset;
    const bottomY = lastSlot.boundingBox.bottom - inset;
    const x = BeatGuitarTechniqueElement.getStrokeLineX(layoutDimensions);
    const arrowWidth = GuitarTechniqueDescriptors.arrowWidth;
    this._boundingBox = new Rect(
      x - arrowWidth / 2,
      topY,
      arrowWidth,
      bottomY - topY
    );

    // The arrowhead tip is at the line end; its base is half its height away.
    const headHeight = GuitarTechniqueDescriptors.arrowHeight / 2;
    const lineHeight = bottomY - topY - headHeight;
    const isPointingUp = options.direction === StrokeDirection.Down;
    if (isPointingUp) {
      this._pathDescriptors = [
        GuitarTechniqueDescriptors.createVerticalLinePath(
          x,
          bottomY,
          lineHeight
        ),
        GuitarTechniqueDescriptors.createVerticalArrowPath(
          x,
          topY + headHeight
        ),
      ];
      return;
    }

    this._pathDescriptors = [
      GuitarTechniqueDescriptors.createVerticalLinePath(
        x,
        topY,
        lineHeight,
        false
      ),
      GuitarTechniqueDescriptors.createVerticalArrowPath(
        x,
        bottomY - headHeight,
        false
      ),
    ];
  }

  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationNodes(): NotationElement[] {
    return [this];
  }

  /** Encodes position and paths; the paths include the stroke direction. */
  public get stateHash(): string {
    return (
      `${this.barLocalCoords.x}` +
      `${this.barLocalCoords.y}` +
      `${JSON.stringify(this._pathDescriptors)}`
    );
  }

  public getStableIdentity(): string {
    return BeatGuitarTechniqueElement.createStableIdentity(
      this.beatElement,
      this._technique.type
    );
  }

  /** SVG path descriptors in beat-local coordinates */
  public get pathDescriptors(): SVGPathDescriptor[] {
    return this._pathDescriptors;
  }

  /** Bar-local origin of the path descriptors: the beat box origin */
  public get pathOriginBarLocal(): Point {
    return this.beatElement.barLocalCoords;
  }

  /** Beat-local bounds of the drawn visual */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return new Point(
      this.beatElement.barLocalCoords.x + this._boundingBox.x,
      this.beatElement.barLocalCoords.y + this._boundingBox.y
    );
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.beatElement.lineLocalCoords.x + this._boundingBox.x,
      this.beatElement.lineLocalCoords.y + this._boundingBox.y
    );
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  /** Global coords of this element */
  public get globalCoords(): Point {
    return new Point(
      this.beatElement.globalCoords.x + this._boundingBox.x,
      this.beatElement.globalCoords.y + this._boundingBox.y
    );
  }

  /** Bounding box of this element in global coordinates */
  public get globalBoundingBox(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
  }
}
