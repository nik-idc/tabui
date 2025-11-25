import { DURATION_TO_NAME, GuitarNote, NoteDuration } from "@/notation/model";
import { Point, createSVGG, createSVGImage, createSVGRect } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import { BeatElement } from "@/notation/controller";
import { SVGTechniqueLabelRenderer } from "./svg-technique-label-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { SVGGuitarNoteRenderer } from "./svg-guitar-note-renderer";
import { GuitarNoteElement } from "@/notation/controller/element/guitar-note-element";

/**
 * Class for rendering a beat element using SVG
 */
export class SVGBeatRenderer implements ElementRenderer {
  /** Beat element */
  private _beatElement: BeatElement;
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
  /** Beat duration SVG image */
  private _beatDurationSVG?: SVGImageElement;
  /** Beat dot SVG image */
  private _beatDotSVG?: SVGImageElement;
  /** Beat selection rectangle */
  private _beatSelectionSVG?: SVGRectElement;

  /** Any events attached to the rendered group */
  private _attachedEvents: Map<string, EventListener> = new Map();

  /**
   * Class for rendering a beat element using SVG
   * @param beatElement Beat element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a bar element in this case)
   */
  constructor(
    beatElement: BeatElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._beatElement = beatElement;
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

    const beatUUID = this._beatElement.beat.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `beat-${beatUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render a beat's duration
   */
  private renderBeatDuration(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beat duration when SVG group undefined");
    }

    const beatUUID = this._beatElement.beat.uuid;
    if (this._beatDurationSVG === undefined) {
      this._beatDurationSVG = createSVGImage();

      // Set id
      this._beatDurationSVG.setAttribute("id", `beat-duration-${beatUUID}`);
      this._beatDurationSVG.setAttribute("preserveAspectRatio", "none");

      // Add element to group SVG element
      this._groupSVG.appendChild(this._beatDurationSVG);
    }

    const x = `${
      this._beatElement.globalCoords.x + this._beatElement.durationRect.x
    }`;
    const y = `${
      this._beatElement.globalCoords.y + this._beatElement.durationRect.y
    }`;
    const width = `${this._beatElement.durationRect.width}`;
    const height = `${this._beatElement.durationRect.height}`;
    const refName = DURATION_TO_NAME[this._beatElement.beat.baseDuration];
    let href: string;
    if (this._beatElement.beat.isEmpty()) {
      href = `${this._assetsPath}/img/notes/rest-${refName}.svg`;
    } else {
      href =
        this._beatElement.beat.beamGroupId !== undefined
          ? `${this._assetsPath}/img/notes/no-flag.svg`
          : `${this._assetsPath}/img/notes/${refName}.svg`;
    }
    this._beatDurationSVG.setAttribute("x", x);
    this._beatDurationSVG.setAttribute("y", y);
    this._beatDurationSVG.setAttribute("width", width);
    this._beatDurationSVG.setAttribute("height", height);
    this._beatDurationSVG.setAttribute("href", href);
  }

  /**
   * Unrender beat duration
   */
  private unrenderBeatDuration(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat duration when SVG group undefined");
    }

    if (this._beatDurationSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._beatDurationSVG);
    this._beatDurationSVG = undefined;
  }

  /**
   * Render a beat's dots
   */
  private renderBeatDots(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beat duration when SVG group undefined");
    }

    const beatUUID = this._beatElement.beat.uuid;
    if (this._beatDotSVG === undefined) {
      this._beatDotSVG = createSVGImage();

      // Set id
      this._beatDotSVG.setAttribute("id", `beat-dot-${beatUUID}`);

      // Add element to group SVG element
      this._groupSVG.appendChild(this._beatDotSVG);
    }

    const x = `${
      this._beatElement.globalCoords.x + this._beatElement.dotRect.x
    }`;
    const y = `${
      this._beatElement.globalCoords.y + this._beatElement.dotRect.y
    }`;
    const width = `${this._beatElement.dotRect.width}`;
    const height = `${this._beatElement.dotRect.height}`;
    const href = `${this._assetsPath}/img/notes/dot${this._beatElement.beat.dots}.svg`;
    this._beatDotSVG.setAttribute("x", x);
    this._beatDotSVG.setAttribute("y", y);
    this._beatDotSVG.setAttribute("width", width);
    this._beatDotSVG.setAttribute("height", height);
    this._beatDotSVG.setAttribute("href", href);
  }

  /**
   * Unrender beat dots
   */
  private unrenderBeatDots(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat duration when SVG group undefined");
    }

    if (this._beatDotSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._beatDotSVG);
    this._beatDotSVG = undefined;
  }

  /**
   * Render beat selection
   */
  private renderBeatSelection(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beat selection when SVG group undefined");
    }

    if (!this._beatElement.selected) {
      throw Error("Tried to render selection of an unselected beat element");
    }

    const beatUUID = this._beatElement.beat.uuid;
    if (this._beatSelectionSVG === undefined) {
      this._beatSelectionSVG = createSVGRect();

      // Set only-set-once attributes
      this._beatSelectionSVG.setAttribute("fill", "gray");
      this._beatSelectionSVG.setAttribute("fill-opacity", "0.25");
      this._beatSelectionSVG.setAttribute("pointer-events", "none");

      // Set id
      this._beatSelectionSVG.setAttribute("id", `beat-sel-${beatUUID}`);

      // Add element to group SVG element
      this._groupSVG.appendChild(this._beatSelectionSVG);
    }

    const x = `${this._beatElement.globalCoords.x + this._beatElement.rect.x}`;
    const y = `${this._beatElement.globalCoords.y}`;
    const width = `${this._beatElement.rect.width}`;
    const height = `${this._beatElement.rect.height}`;
    this._beatSelectionSVG.setAttribute("x", x);
    this._beatSelectionSVG.setAttribute("y", y);
    this._beatSelectionSVG.setAttribute("width", width);
    this._beatSelectionSVG.setAttribute("height", height);
  }

  /**
   * Unrender beat selection
   */
  private unrenderBeatSelection(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat selection when SVG group undefined");
    }

    if (this._beatSelectionSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._beatSelectionSVG);
    this._beatSelectionSVG = undefined;
  }

  /**
   * Render needed labels & unrender unneccesary ones
   * @param beatOffset Global offset of the beat element
   */
  private renderLabels(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render beat labels when SVG group undefined");
    }

    /**
     * DONT ADD TO THE ROOT ELEMENT, ADD TO THE PARENT ELEMENT
     */

    // Check if there are any technique labels to remove
    const curTechniqueLabelUUIDs = new Set(
      this._beatElement.techniqueLabelElements.map((e) => e.technique.uuid)
    );
    for (const [uuid, renderer] of this._renderedLabels) {
      if (!curTechniqueLabelUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedLabels.delete(uuid);
      }
    }

    // Add & render new technique label element
    for (const techniqueLabelElement of this._beatElement
      .techniqueLabelElements) {
      const renderedLabel = this._renderedLabels.get(
        techniqueLabelElement.technique.uuid
      );
      if (renderedLabel === undefined) {
        const renderer = new SVGTechniqueLabelRenderer(
          techniqueLabelElement,
          this._assetsPath,
          this._groupSVG
        );
        renderer.render();
        this._renderedLabels.set(
          techniqueLabelElement.technique.uuid,
          renderer
        );
      } else {
        renderedLabel.render();
      }
    }
  }

  /**
   * Unrender all technique labels
   */
  private unrenderLabels(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat labels when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedLabels) {
      renderer.unrender();
    }
  }

  private renderNoteElements(): SVGNoteRenderer[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render note element when SVG group undefined");
    }

    const activeRenderers: SVGNoteRenderer[] = [];

    // Check if there are any notes to remove
    const curNoteUUIDs = new Set(
      this._beatElement.beatNotesElement.noteElements.map((n) => n.note.uuid)
    );
    for (const [uuid, renderer] of this._renderedNoteElements) {
      if (!curNoteUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedNoteElements.delete(uuid);
      }
    }

    // Add & render new note element AND re-render existing notes
    for (const noteElement of this._beatElement.beatNotesElement.noteElements) {
      const renderedNote = this._renderedNoteElements.get(
        noteElement.note.uuid
      );
      if (renderedNote === undefined) {
        if (noteElement instanceof GuitarNoteElement) {
          const renderer = new SVGGuitarNoteRenderer(
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

    this.renderLabels();
    const newNoteRenderers = this.renderNoteElements();

    this.renderBeatDuration();
    if (this._beatElement.beat.dots > 0) {
      this.renderBeatDots();
    } else {
      this.unrenderBeatDots();
    }

    if (this._beatElement.selected) {
      this.renderBeatSelection();
    } else {
      this.unrenderBeatSelection();
    }

    return newNoteRenderers;
  }

  /**
   * Unrender all beat element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender beat elem when SVG group undefined");
    }

    this.unrenderLabels();
    this.unrenderNoteElements();
    this.unrenderBeatDuration();
    this.unrenderBeatDots();
    this.unrenderBeatSelection();

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
      eventHandler(event as SVGElementEventMap[K], this._beatElement);
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
