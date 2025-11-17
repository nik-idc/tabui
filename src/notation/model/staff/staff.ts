import { randomInt } from "@/shared";
import { Bar, BarJSON } from "../bar/bar";
import { TrackContext } from "../context/track-context";
import { MusicInstrument } from "../instrument/instrument";
import { ClefType } from "./clef-type";
import { MasterBar } from "../bar/master-bar";
import { Beat } from "../beat";
import { Track } from "../track/track";

/**
 * Staff JSON format
 */
export interface StaffJSON {
  bars: BarJSON[];
  clefType: ClefType;
  showTablature: boolean;
  showClassicNotation: boolean;
}

/**
 * A staff in this context is a representation of an
 * individually played part on an instrument. For example:
 * - A piano usually has 2 staffs: Treble & Bass (i.e. right & left hand parts)
 * - A guitar usually has 1 staff
 */
export class Staff<I extends MusicInstrument = MusicInstrument> {
  /** Staff's unqiue identifier */
  readonly uuid: number;
  /** Track in which the staff lives */
  readonly track: Track<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;

  /** Bars belonging to the staff */
  private _bars: Bar<I>[];
  /** Clef type for the staff */
  private _clefType: ClefType;
  /** Indicates whether to display guitar tablature  */
  private _showTablature: boolean;
  /** Indicates whether to display classical music notation  */
  private _showClassicNotation: boolean;

  /**
   * A staff in this context is a representation of an
   * individually played part on an instrument
   * @param trackContext Track context
   * @param bars Bars belonging to the staff
   * @param clefType Clef type
   */
  constructor(
    track: Track<I>,
    trackContext: TrackContext<I>,
    bars: Bar<I>[] = [],
    clefType: ClefType = ClefType.Treble,
    showTablature: boolean = true,
    showClassicNotation: boolean = false
  ) {
    this.uuid = randomInt();
    this.track = track;
    this.trackContext = trackContext;

    this._bars = bars;
    this._clefType = clefType;
    this._showTablature = showTablature;
    this._showClassicNotation = showClassicNotation;
  }

  /**
   * Inserts a bar to the staff after the specified index
   * @param index Index after which to insert the bar
   * @param masterBar Master bar
   * @param beats Beats
   */
  public insertBar(
    index: number,
    masterBar: MasterBar,
    beats: Beat<I>[] = []
  ): void {
    const newBar = new Bar<I>(this, this.trackContext, masterBar, beats);
    this._bars.splice(index, 0, newBar);
  }

  /**
   * Appends bar to the staff bars
   * @param masterBar Master bar
   * @param beats Beats
   */
  public appendBar(masterBar: MasterBar, beats: Beat<I>[] = []): void {
    const newBar = new Bar<I>(this, this.trackContext, masterBar, beats);
    this._bars.push(newBar);
  }

  /**
   * Prepends bar to the staff bars
   * @param masterBar Master bar
   * @param beats Beats
   */
  public prependBar(masterBar: MasterBar, beats: Beat<I>[] = []): void {
    const newBar = new Bar<I>(this, this.trackContext, masterBar, beats);
    this._bars.unshift(newBar);
  }

  /**
   * Removes a bar from the staff at the specified index
   * @param index Index of the bar to remove
   */
  public removeBar(index: number): void {
    this._bars.splice(index, 1);
  }

  /**
   * Converts staff to JSON format
   */
  public toJSON(): StaffJSON {
    const barsJSON: BarJSON[] = [];
    for (const bar of this._bars) {
      barsJSON.push(bar.toJSON());
    }

    return {
      bars: barsJSON,
      clefType: this._clefType,
      showTablature: this._showTablature,
      showClassicNotation: this._showClassicNotation,
    };
  }

  /**
   * Get next beat in the tab
   * @param barIndex Bar index
   * @param beatIndex Beat index (inside the bar)
   * @returns Beat (or null if current beat is last one)
   */

  /**
   * Get next beat in the staff
   * @param beat Beat after which to find the next beat
   * @returns Next beat or null if passed beat is the last one
   */
  public getNextBeat(beat: Beat<I>): Beat<I> | null {
    const beatIndex = beat.bar.beats.indexOf(beat);
    const nextBeatInBar = beat.bar.beats[beatIndex + 1];
    if (nextBeatInBar !== undefined) {
      return nextBeatInBar;
    }

    const barIndex = this._bars.indexOf(beat.bar);
    const nextBar = this._bars[barIndex + 1];
    if (nextBar !== undefined) {
      return nextBar.beats[0];
    }

    return null;
  }

  /**
   * Get prev beat in the staff
   * @param beat Beat before which to find the prev beat
   * @returns Prev beat or null if passed beat is the first one
   */
  public getPrevBeat(beat: Beat<I>): Beat | null {
    const beatIndex = beat.bar.beats.indexOf(beat);
    const prevBeatInBar = beat.bar.beats[beatIndex - 1];
    if (prevBeatInBar !== undefined) {
      return prevBeatInBar;
    }

    const barIndex = this._bars.indexOf(beat.bar);
    const prevBar = this._bars[barIndex - 1];
    if (prevBar !== undefined) {
      return prevBar.beats[prevBar.beats.length - 1];
    }

    return null;
  }

  /**
   * All the beats as an array. Does a flat map, so consider performance
   */
  public getBeatsSeq(): Beat<I>[] {
    return this._bars.flatMap((bar) => {
      return bar.beats;
    });
  }

  /** Bars getter */
  public get bars(): Bar<I>[] {
    return this._bars;
  }

  /** Clef type for the staff */
  public get clefType(): ClefType {
    return this._clefType;
  }

  /** Show tablature setter */
  public set showTablature(newShowTablature: boolean) {
    this._showTablature = newShowTablature;
  }
  /** Indicates whether to display guitar tablature */
  public get showTablature(): boolean {
    return this._showTablature;
  }

  /** Show classic notation setter */
  public set showClassicNotation(newShowClassicNotation: boolean) {
    this._showTablature = newShowClassicNotation;
  }
  /** Indicates whether to display classical music notation */
  public get showClassicNotation(): boolean {
    return this._showClassicNotation;
  }
}
