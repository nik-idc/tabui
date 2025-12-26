import {
  DURATION_TO_FLAG_COUNT,
  DURATION_TO_NAME,
  GuitarNote,
  MAX_FLAG_COUNT,
  NoteDuration,
} from "@/notation/model";
import {
  Point,
  createSVGCircle,
  createSVGG,
  createSVGImage,
  createSVGLine,
  createSVGRect,
} from "@/shared";
import { ElementRenderer } from "../element-renderer";
import {
  BeatElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { SVGTechniqueLabelRenderer } from "./svg-technique-label-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { SVGGuitarNoteRenderer } from "./svg-guitar-note-renderer";
import { TabNoteElement } from "@/notation/controller/element/tab-note-element";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { TabBeatElement } from "@/notation/controller/element/tab-beat-element";

/**
 * Class for rendering a beat element using SVG
 */
export class SVGTabBeatRenderer implements SVGBeatRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Beat element */
  readonly beatElement: TabBeatElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered labels map */
  private _renderedLabels: Map<number, SVGTechniqueLabelRenderer>;
  /** Rendered note elements map */
  private _renderedNoteElements: Map<number, SVGNoteRenderer>;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;
  /** Beat duration SVG line */
  private _durationStemSVG?: SVGLineElement;
  /** Beat duration SVG flag lines*/
  private _durationFlagsSVG?: SVGLineElement[];
  /** Beat first dot SVG circle */
  private _dot1CircleSVG?: SVGCircleElement;
  /** Beat second dot SVG circle */
  private _dot2CircleSVG?: SVGCircleElement;
  /** Beat selection rectangle */
  private _beatSelectionSVG?: SVGRectElement;

  /** Any events attached to the rendered group */
  private _attachedEvents: Map<string, EventListener> = new Map();

  /**
   * Class for rendering a beat element using SVG
   * @param trackController Track controller
   * @param beatElement Beat element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    trackController: TrackController,
    beatElement: TabBeatElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.beatElement = beatElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedLabels = new Map();
    this._renderedNoteElements = new Map();
    this._attachedEvents = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the beat
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const beatUUID = this.beatElement.beat.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `beat-${beatUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Renders duration stem
   */
  private renderDurationStem(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beat duration when SVG group undefined");
    }

    const stemGlobal = this.beatElement.durationStemLineGlobal;
    if (stemGlobal === undefined) {
      return;
    }

    const beatUUID = this.beatElement.beat.uuid;
    if (this._durationStemSVG === undefined) {
      this._durationStemSVG = createSVGLine();

      // Set id
      this._durationStemSVG.setAttribute("id", `beat-dur-stem-${beatUUID}`);
      this._durationStemSVG.setAttribute("stroke", "black");

      // Add element to group SVG element
      this._groupSVG.appendChild(this._durationStemSVG);
    }

    const x = `${stemGlobal.x}`;
    const y1 = `${stemGlobal.y1}`;
    const y2 = `${stemGlobal.y2}`;
    this._durationStemSVG.setAttribute("x1", x);
    this._durationStemSVG.setAttribute("x2", x);
    this._durationStemSVG.setAttribute("y1", y1);
    this._durationStemSVG.setAttribute("y2", y2);
  }

  /**
   * Unrender duration stem
   */
  private unrenderDurationStem(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender duration stem when SVG group undefined");
    }

    if (this._durationStemSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._durationStemSVG);
    this._durationStemSVG = undefined;
  }

  /**
   * Renders a single duration flag
   * @param flagIndex Index of the flag
   */
  private renderDurationFlag(flagIndex: number): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beat duration when SVG group undefined");
    }

    if (this._durationFlagsSVG === undefined) {
      throw Error("Tried to render beat duration when flags array undefined");
    }

    const flagLinesGlobal = this.beatElement.durationFlagLinesGlobal;
    if (flagLinesGlobal === undefined) {
      return;
    }

    const beatUUID = this.beatElement.beat.uuid;
    if (this._durationFlagsSVG[flagIndex] === undefined) {
      this._durationFlagsSVG[flagIndex] = createSVGLine();

      // Set id
      this._durationFlagsSVG[flagIndex].setAttribute(
        "id",
        `beat-dur-flag-${flagIndex}-${beatUUID}`
      );
      this._durationFlagsSVG[flagIndex].setAttribute("stroke", "black");

      // Add element to group SVG element
      this._groupSVG.appendChild(this._durationFlagsSVG[flagIndex]);
    }

    const x1 = `${flagLinesGlobal[flagIndex].x1}`;
    const x2 = `${flagLinesGlobal[flagIndex].x2}`;
    const y = `${flagLinesGlobal[flagIndex].y}`;
    this._durationFlagsSVG[flagIndex].setAttribute("x1", x1);
    this._durationFlagsSVG[flagIndex].setAttribute("x2", x2);
    this._durationFlagsSVG[flagIndex].setAttribute("y1", y);
    this._durationFlagsSVG[flagIndex].setAttribute("y2", y);
  }

  /**
   * Unrenders a single duration flag
   * @param flagIndex Index of the flag
   */
  private unrenderDurationFlag(flagIndex: number): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat duration when SVG group undefined");
    }

    if (this._durationFlagsSVG === undefined) {
      throw Error("Tried to unrender beat duration when flags array undefined");
    }

    if (this._durationFlagsSVG[flagIndex] === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._durationFlagsSVG[flagIndex]);
    this._durationFlagsSVG.splice(flagIndex, 1);
  }

  /**
   * Renders all duration flags
   */
  private renderDurationFlags(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render duration flags when SVG group undefined");
    }

    if (this.beatElement.durationFlagLines === undefined) {
      return;
    }

    this._durationFlagsSVG = [];
    const beatFlagCount =
      DURATION_TO_FLAG_COUNT[this.beatElement.beat.baseDuration];
    for (let i = 0; i < beatFlagCount; i++) {
      if (i <= beatFlagCount) {
        this.renderDurationFlag(i);
      } else {
        this.unrenderDurationFlag(i);
      }
    }
  }

  /**
   * Unrenders all duration flags
   */
  private unrenderDurationFlags(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender duration flags when SVG group undefined");
    }

    if (this._durationFlagsSVG === undefined) {
      return;
    }

    if (this._durationFlagsSVG.length === 0) {
      return;
    }

    for (let i = 0; i < MAX_FLAG_COUNT; i++) {
      this.unrenderDurationFlag(i);
    }
    this._durationFlagsSVG = undefined;
  }

  /**
   * Render dots
   */
  private renderDotCircle(dot1: boolean): void {
    let dotCircle = dot1 ? this._dot1CircleSVG : this._dot2CircleSVG;

    if (this._groupSVG === undefined) {
      throw Error("Tried to render dot circle when SVG group undefined");
    }

    const beatUUID = this.beatElement.beat.uuid;
    if (dotCircle === undefined) {
      dotCircle = createSVGCircle();

      dotCircle.setAttribute("id", `beat-dot-${dot1 ? 1 : 2}-${beatUUID}`);

      this._groupSVG.appendChild(dotCircle);
    }

    const circle = dot1
      ? this.beatElement.dot1CircleGlobal
      : this.beatElement.dot2CircleGlobal;
    if (circle === undefined) {
      throw Error("Tried to render dot circle when circle undefined");
    }
    dotCircle.setAttribute("cx", `${circle.centerX}`);
    dotCircle.setAttribute("cy", `${circle.centerY}`);
    dotCircle.setAttribute("r", `${circle.diameter / 2}`);
  }

  /**
   * Unrender duration stem
   */
  private unrenderDotCircle(dot1: boolean): void {
    let dotCircle = dot1 ? this._dot1CircleSVG : this._dot2CircleSVG;
    if (this._groupSVG === undefined) {
      throw Error(
        "Tried to unrender duration dot circle when SVG group undefined"
      );
    }

    if (dotCircle === undefined) {
      return;
    }

    this._groupSVG.removeChild(dotCircle);
    dotCircle = undefined;
  }

  private renderNoteElements(): SVGNoteRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render note element when SVG group undefined");
    }

    const activeRenderers: SVGNoteRenderer[] = [];

    // Check if there are any notes to remove
    const curNoteUUIDs = new Set(
      this.beatElement.noteElements.map((n) => n.note.uuid)
    );
    for (const [uuid, renderer] of this._renderedNoteElements) {
      if (!curNoteUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedNoteElements.delete(uuid);
      }
    }

    // Add & render new note element AND re-render existing notes
    for (const noteElement of this.beatElement.noteElements) {
      const renderedNote = this._renderedNoteElements.get(
        noteElement.note.uuid
      );
      if (renderedNote === undefined) {
        if (noteElement instanceof TabNoteElement) {
          const renderer = new SVGGuitarNoteRenderer(
            this.trackController,
            noteElement,
            this._assetsPath,
            this._groupSVG
          );
          renderer.render();
          this._renderedNoteElements.set(noteElement.note.uuid, renderer);
          activeRenderers.push(renderer);
        }
      } else {
        activeRenderers.push(renderedNote);
        renderedNote.render();
      }
    }
    return activeRenderers;
  }

  /**
   * Unrender all note element
   */
  private unrenderNoteElements(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note element when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedNoteElements) {
      renderer.unrender();
    }
  }

  /**
   * Render a full beat
   */
  public render(): ElementRenderer[] {
    this.renderGroup();

    const newNoteRenderers = this.renderNoteElements();

    this.renderDurationStem();
    this.renderDurationFlags();
    if (this.beatElement.beat.dots > 0) {
      this.renderDotCircle(true);
      if (this.beatElement.beat.dots === 2) {
        this.renderDotCircle(false);
      }
    } else {
      this.unrenderDotCircle(true);
      this.unrenderDotCircle(false);
    }

    // if (this.beatElement.selected) {
    //   this.renderBeatSelection();
    // } else {
    //   this.unrenderBeatSelection();
    // }

    return newNoteRenderers;
  }

  /**
   * Unrender all beat element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat elem when SVG group undefined");
    }

    // this.unrenderLabels();
    this.unrenderNoteElements();
    this.unrenderDurationStem();
    this.unrenderDurationFlags();
    this.unrenderDotCircle(true);
    this.unrenderDotCircle(false);
    // this.unrenderBeatSelection();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }

  /**
   * Attaches a mouse event to the beat element
   * @param eventType Type of event ('click', 'move' etc)
   * @param event Event handler itself
   */
  public attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beatElement: BeatElement
    ) => void
  ): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to add beat click event when SVG group undefined");
    }

    const listener = (event: Event) => {
      eventHandler(event as SVGElementEventMap[K], this.beatElement);
    };

    if (this._attachedEvents.has(eventType)) {
      this._groupSVG.removeEventListener(
        eventType,
        this._attachedEvents.get(eventType)!
      );
    }

    this._groupSVG.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
  }

  public get noteRenderers(): SVGNoteRenderer[] {
    return Array.from(this.noteRenderers.values());
  }
}

// ==============================
// ==== MAY BE USEFULL LATER ====
//
// /**
//  * Render beat selection
//  */
// private renderBeatSelection(): void {
//   if (this._groupSVG === undefined) {
//     throw Error("Tried to render beat selection when SVG group undefined");
//   }

//   if (!this.beatElement.selected) {
//     throw Error("Tried to render selection of an unselected beat element");
//   }

//   const beatUUID = this.beatElement.beat.uuid;
//   if (this._beatSelectionSVG === undefined) {
//     this._beatSelectionSVG = createSVGRect();

//     // Set only-set-once attributes
//     this._beatSelectionSVG.setAttribute("fill", "gray");
//     this._beatSelectionSVG.setAttribute("fill-opacity", "0.25");
//     this._beatSelectionSVG.setAttribute("pointer-events", "none");

//     // Set id
//     this._beatSelectionSVG.setAttribute("id", `beat-sel-${beatUUID}`);

//     // Add element to group SVG element
//     this._groupSVG.appendChild(this._beatSelectionSVG);
//   }

//   const x = `${this.beatElement.globalCoords.x}`;
//   const y = `${this.beatElement.globalCoords.y}`;
//   const width = `${this.beatElement.rect.width}`;
//   const height = `${this.beatElement.rect.height}`;
//   this._beatSelectionSVG.setAttribute("x", x);
//   this._beatSelectionSVG.setAttribute("y", y);
//   this._beatSelectionSVG.setAttribute("width", width);
//   this._beatSelectionSVG.setAttribute("height", height);
// }

// /**
//  * Unrender beat selection
//  */
// private unrenderBeatSelection(): void {
//   if (this._groupSVG === undefined) {
//     throw Error("Tried to unrender beat selection when SVG group undefined");
//   }

//   if (this._beatSelectionSVG === undefined) {
//     return;
//   }

//   this._groupSVG.removeChild(this._beatSelectionSVG);
//   this._beatSelectionSVG = undefined;
// }

// /**
//  * Render needed labels & unrender unneccesary ones
//  * @param beatOffset Global offset of the beat element
//  */
// private renderLabels(): void {
//   if (this._groupSVG === undefined) {
//     throw Error("Tried to render beat labels when SVG group undefined");
//   }

//   /**
//    * DONT ADD TO THE ROOT ELEMENT, ADD TO THE PARENT ELEMENT
//    */

//   // Check if there are any technique labels to remove
//   const curTechniqueLabelUUIDs = new Set(
//     this.beatElement.techniqueLabelElements.map((e) => e.technique.uuid)
//   );
//   for (const [uuid, renderer] of this._renderedLabels) {
//     if (!curTechniqueLabelUUIDs.has(uuid)) {
//       renderer.unrender();
//       this._renderedLabels.delete(uuid);
//     }
//   }

//   // Add & render new technique label element
//   for (const techniqueLabelElement of this.beatElement
//     .techniqueLabelElements) {
//     const renderedLabel = this._renderedLabels.get(
//       techniqueLabelElement.technique.uuid
//     );
//     if (renderedLabel === undefined) {
//       const renderer = new SVGTechniqueLabelRenderer(
//         this.trackController,
//         techniqueLabelElement,
//         this._assetsPath,
//         this._groupSVG
//       );
//       renderer.render();
//       this._renderedLabels.set(
//         techniqueLabelElement.technique.uuid,
//         renderer
//       );
//     } else {
//       renderedLabel.render();
//     }
//   }
// }

// /**
//  * Unrender all technique labels
//  */
// private unrenderLabels(): void {
//   if (this._groupSVG === undefined) {
//     throw Error("Tried to unrender beat labels when SVG group undefined");
//   }

//   for (const [uuid, renderer] of this._renderedLabels) {
//     renderer.unrender();
//   }
// }
// ==== MAY BE USEFULL LATER ====
// ==============================
