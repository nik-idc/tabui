import {
  Beat,
  DURATION_TO_FLAG_COUNT,
  GuitarNote,
  NoteDuration,
  VoiceNumber,
} from "../../../model";
import { Rect, Point, randomInt } from "../../../../shared";
import { HorLine, VertLine } from "../../../../shared/rendering/geometry/line";
import { Circle } from "../../../../shared/rendering/geometry/circle";
import { TrackElement } from "../track-element";
import { TabNoteElement } from "../note/tab-note-element";
import { BeatElement } from "./beat-element";
import { BarElement } from "../bar/bar-element";
import { NoteElement } from "../note/note-element";
import { NotationElement } from "../notation-element";
import { VoiceBarElement } from "../bar/voice-bar-element";
import type { TrackLineElement } from "../track/track-line-element";

/**
 * Class that handles geometry & visually relevant info of a beat
 */
export class TabBeatElement implements BeatElement {
  public static createStableIdentity_NEW(
    trackLineStableIdentity: string,
    beat: Beat
  ): string {
    return `tab-beat:${trackLineStableIdentity}:${beat.uuid}`;
  }

  public static createStableIdentity(
    voiceBarElement: VoiceBarElement,
    beat: Beat
  ): string {
    const trackLineStableIdentity =
      voiceBarElement.barElement.notationStyleLineElement.staffLineElement.trackLineElement.getStableIdentity();
    return TabBeatElement.createStableIdentity_NEW(
      trackLineStableIdentity,
      beat
    );
  }

  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent bar element */
  readonly voiceBarElement: VoiceBarElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  public get voiceNumber(): VoiceNumber {
    return this.beat.voiceBar.voiceNumber;
  }

  public get owningTrackLineElement(): TrackLineElement {
    return this.barElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.barElement;
  }

  /** Note elements */
  private _noteElements: TabNoteElement[];

  /** This beat's rect */
  private _boundingBox: Rect;
  private _restRect: Rect | null;

  /**
   * Class that handles geometry & visually relevant info of a beat
   * @param beat Beat
   * @param voiceBarElement Parent bar element
   */
  constructor(beat: Beat, voiceBarElement: VoiceBarElement) {
    this.uuid = randomInt();
    this.beat = beat;
    this.voiceBarElement = voiceBarElement;
    this.trackElement = this.voiceBarElement.trackElement;

    this._noteElements = [];

    this._boundingBox = new Rect();
    this._restRect = null;

    this.build();
  }

  public build(): void {
    const prevNoteElements = new Map(
      this._noteElements.map((element) => [
        element.getStableIdentity(),
        element,
      ])
    );
    this._noteElements = [];
    const maxPolyphony = this.beat.trackContext.instrument.maxPolyphony;
    for (let i = 0; i < maxPolyphony; i++) {
      const note = (this.beat.notes?.[i] as GuitarNote | undefined) ?? null;
      const existingNoteElement = prevNoteElements.get(
        TabNoteElement.createStableIdentity(this, i + 1)
      );
      if (existingNoteElement !== undefined) {
        existingNoteElement.setNote(note);
        existingNoteElement.build();
        this._noteElements.push(existingNoteElement);
        continue;
      }

      this._noteElements.push(new TabNoteElement(this, i + 1, note));
    }
  }

  /**
   * Calculates the dimensions of the tab beat element & it's children
   */
  public measure(): void {
    const width = this.voiceBarElement.getBeatWidth(this.beat);
    const notesHeight =
      this._noteElements.length *
      this.trackElement.layoutDimensions.NOTE_RECT_HEIGHT;
    this._boundingBox.setDimensions(width, notesHeight);
    this._restRect = this.beat.isRest() ? new Rect() : null;
    this._restRect?.setDimensions(
      this.trackElement.layoutDimensions.NOTE_TEXT_SIZE,
      this.trackElement.layoutDimensions.NOTE_TEXT_SIZE
    );

    for (const noteElement of this._noteElements) {
      noteElement.measure();
    }
  }

  /**
   * Calculates the coordinates of tab beat element & it's child note elements
   */
  public layout(): void {
    const x = this.voiceBarElement.getBeatX(this.beat);

    this._boundingBox.setCoords(x, 0);

    this._restRect?.setCoords(
      this.attackLocalX - this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2,
      this._boundingBox.height / 2 - this._restRect.height / 2
    );

    for (const noteElement of this._noteElements) {
      noteElement.layout();
    }
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  private buildStateHash(): string {
    const hashArr: string[] = [
      `${this.barLocalBoundingBox.x}` +
        `${this.barLocalBoundingBox.y}` +
        `${this.barLocalBoundingBox.width}` +
        `${this.barLocalBoundingBox.height}`,
      `${this._restRect?.x ?? ""}` +
        `${this._restRect?.y ?? ""}` +
        `${this._restRect?.width ?? ""}` +
        `${this._restRect?.height ?? ""}`,
    ];

    return hashArr.join("");
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    const elements: NotationElement[] = [this];

    for (const noteElement of this._noteElements) {
      elements.push(...noteElement.refreshOwnedNotationElements());
    }

    return elements;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TabBeatElement.createStableIdentity(this.voiceBarElement, this.beat);
  }

  public get barElement(): BarElement {
    return this.voiceBarElement.barElement;
  }

  public get attackLocalX(): number {
    return 0;
  }

  public get attackX(): number {
    return this._boundingBox.x + this.attackLocalX;
  }

  public get attackXBarLocal(): number {
    return this.barLocalCoords.x + this.attackLocalX;
  }

  /**
   * Gets next note element
   * @param noteElement Note element
   * @returns Next note element or null
   */
  public getNextNoteElement(
    noteElement: TabNoteElement
  ): TabNoteElement | null {
    const noteIndex = this._noteElements.indexOf(noteElement);
    const nextNote = this._noteElements[noteIndex + 1];
    return nextNote ?? null;
  }

  /**
   * Gets prev note element
   * @param noteElement Note element
   * @returns Prev note element or null
   */
  public getPrevNoteElement(
    noteElement: TabNoteElement
  ): TabNoteElement | null {
    const noteIndex = this._noteElements.indexOf(noteElement);
    const prevNote = this._noteElements[noteIndex - 1];
    return prevNote ?? null;
  }

  /** Beat's note element */
  public get noteElements(): TabNoteElement[] {
    return this._noteElements;
  }

  public get restRect(): Rect | null {
    return this._restRect;
  }

  public get restRectBarLocal(): Rect | null {
    if (this._restRect === null) {
      return null;
    }

    return new Rect(
      this.barLocalCoords.x + this._restRect.x,
      this.barLocalCoords.y + this._restRect.y,
      this._restRect.width,
      this._restRect.height
    );
  }

  /**
   * Bounds used for selection overlays and beat-level hit testing.
   * Unlike the layout bounding box, this includes tab note/rest text that can
   * extend left of the beat attack while centered on the staff line.
   */
  public getGlobalVisualBounds(): Rect {
    const rect = new Rect(
      this.barElement.globalCoords.x + this.barLocalBoundingBox.x,
      this.barElement.globalCoords.y + this.barLocalBoundingBox.y,
      this.barLocalBoundingBox.width,
      this.barLocalBoundingBox.height
    );

    const restRect = this.restRectBarLocal;
    if (restRect !== null) {
      const restLeft = this.barElement.globalCoords.x + restRect.x;
      rect.x = Math.min(rect.x, restLeft);
    }

    for (const noteElement of this.noteElements) {
      if (noteElement.note === null) {
        continue;
      }
      rect.x = Math.min(rect.x, noteElement.textRectGlobal.x);
    }

    return rect;
  }

  public get durationStemLine(): VertLine | undefined {
    return undefined;
  }

  public get durationStemLineBarLocal(): VertLine | undefined {
    return undefined;
  }

  public get durationFlagLines(): HorLine[] | undefined {
    return undefined;
  }

  public get durationFlagLinesBarLocal(): HorLine[] | undefined {
    return undefined;
  }

  public get dot1CircleBarLocal(): Circle | undefined {
    return undefined;
  }

  public get dot2CircleBarLocal(): Circle | undefined {
    return undefined;
  }

  /** This beat's layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in bar-local coordinates */
  public get barLocalCoords(): Point {
    return new Point(
      this.voiceBarElement.boundingBox.x + this._boundingBox.x,
      this.voiceBarElement.boundingBox.y + this._boundingBox.y
    );
  }

  /** Bounding box of this element in bar-local coordinates */
  public get barLocalBoundingBox(): Rect {
    return new Rect(
      this.barLocalCoords.x,
      this.barLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.voiceBarElement.lineLocalCoords.x + this.barLocalCoords.x,
      this.voiceBarElement.lineLocalCoords.y + this.barLocalCoords.y
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

  /** This beat's layout bounding box in global coordinates */
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

  /** Global coords of the tab beat element */
  public get globalCoords(): Point {
    return new Point(
      this.voiceBarElement.globalCoords.x + this.barLocalCoords.x,
      this.voiceBarElement.globalCoords.y + this.barLocalCoords.y
    );
  }
}
