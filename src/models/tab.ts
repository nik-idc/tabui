import { Bar } from "./bar";
import { Beat } from "./beat";
import { Guitar } from "./guitar";
import { GuitarEffect } from "./guitar-effect/guitar-effect";
import { OPTIONS_DEMANDING_EFFECTS } from "./guitar-effect/guitar-effect-lists";
import { GuitarEffectOptions } from "./guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "./guitar-effect/guitar-effect-type";
import { GuitarNote } from "./guitar-note";
import { Note, NoteValue } from "./note";
import { NoteDuration } from "./note-duration";
import { randomInt } from "../misc/random-int";

/**
 * Class that represents a guitar tab
 */
export class Tab {
  /**
   * Unique identifier
   */
  readonly uuid: number;
  /**
   * Tab name
   */
  public name: string;
  /**
   * Instrument name
   */
  public instrumentName: string;
  /**
   * Guitar
   */
  readonly guitar: Guitar;
  /**
   * Bars of the tab
   */
  private _bars: Bar[];

  /**
   * Class that represents a guitar tab
   * @param name Tab name
   * @param instrumentName Instrument name
   * @param guitar Guitar
   * @param bars Bars of the tab
   */
  constructor(
    name: string = "Unnamed",
    instrumentName: string = "Unknown instrument",
    guitar: Guitar = new Guitar(),
    bars: Bar[] = []
  ) {
    this.uuid = randomInt();

    this.name = name;
    this.instrumentName = instrumentName;
    this.guitar = guitar;
    this._bars = bars;

    if (bars.length === 0) {
      this._bars = [
        new Bar(this.guitar, 120, 4, NoteDuration.Quarter, undefined),
      ];
    } else {
      this._bars = bars;
    }
  }

  /**
   * Prepends a bar to the tab. If no bar provided an empty one is created.
   * DO NOT USE THIS ANYWHERE OUTSIDE OF THE SCORE CLASS
   * OTHERWISE THE UI WILL BE MESSED UP
   * @param bar Bar to append
   */
  public prependBar(bar?: Bar): void {
    if (bar === undefined) {
      const firstBar = this._bars[0];
      bar = Bar.defaultBar(
        firstBar.guitar,
        firstBar.tempo,
        firstBar.beatsCount,
        firstBar.duration
      );
    }

    this._bars.unshift(bar);
  }

  /**
   * Appends a bar to the tab. If no bar provided an empty one is created.
   * DO NOT USE THIS ANYWHERE OUTSIDE OF THE SCORE CLASS
   * OTHERWISE THE UI WILL BE MESSED UP
   * @param bar Bar to append
   */
  public appendBar(bar?: Bar): void {
    if (bar === undefined) {
      const lastBar = this._bars[this._bars.length - 1];
      bar = Bar.defaultBar(
        lastBar.guitar,
        lastBar.tempo,
        lastBar.beatsCount,
        lastBar.duration
      );
    }

    this._bars.push(bar);
  }

  /**
   * Inserts a bar to the tab. If no bar provided an empty one is created.
   * Inserts BEFORE specified index.
   * DO NOT USE THIS ANYWHERE OUTSIDE OF THE SCORE CLASS
   * OTHERWISE THE UI WILL BE MESSED UP
   * @param bar Bar to append
   */
  public insertBar(barIndex: number, bar?: Bar): void {
    if (barIndex < 0 || barIndex > this.bars.length) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    if (bar === undefined) {
      const prevBar = this._bars[barIndex];
      bar = Bar.defaultBar(
        prevBar.guitar,
        prevBar.tempo,
        prevBar.beatsCount,
        prevBar.duration
      );
    }

    this._bars.splice(barIndex, 0, bar);
  }

  /**
   * Removes bar from the tab.
   * DO NOT USE THIS ANYWHERE OUTSIDE OF THE SCORE CLASS
   * OTHERWISE THE UI WILL BE MESSED UP
   * @param barIndex Index of the bar to remove
   */
  public removeBar(barIndex: number): void {
    if (barIndex < 0 || barIndex > this._bars.length - 1) {
      throw Error(`Can't remove bar at index ${barIndex}`);
    }

    this._bars.splice(barIndex, 1);
  }

  /**
   * Removes beat from tab
   * @param beatToRemove Beat to remove
   */
  public removeBeat(beatToRemove: Beat): void {
    // remove beat based on the bar id
    // get bar id using beat uuid
    const bar = this._bars.filter((bar) => {
      return bar.beats.some((beat) => {
        return beat.uuid === beatToRemove.uuid;
      });
    })[0];
    const insideBarIndex = bar.beats.findIndex(
      (beat) => beat.uuid === beatToRemove.uuid
    );
    bar.removeBeat(insideBarIndex);
  }

  /**
   * Removes beats from tab
   * @param beats Beats to remove
   */
  public removeBeats(beats: Beat[]): void {
    for (const beat of beats) {
      this.removeBeat(beat);
    }
  }

  /**
   * Replaces beat section with another beat section
   * @param oldBeats Old beats
   * @param newBeats New beats
   */
  public replaceBeats(oldBeats: Beat[], newBeats: Beat[]): void {
    if (oldBeats.length > newBeats.length) {
      // Replace beats' notes values
      for (let i = 0; i < newBeats.length; i++) {
        oldBeats[i].duration = newBeats[i].duration;
        for (let j = 0; j < this.guitar.stringsCount; j++) {
          oldBeats[i].notes[j].fret = newBeats[i].notes[j].fret;
        }
      }

      // Remove 'excess' beats
      this.removeBeats(oldBeats.slice(newBeats.length, oldBeats.length));
    } else if (oldBeats.length < newBeats.length) {
      // Get starting bar for later usage
      const bar = this._bars.filter((bar) => {
        return bar.beats.some((beat) => {
          return beat.uuid === oldBeats[0].uuid;
        });
      })[0];

      const beatIndex = bar.beats.findIndex((b) => b.uuid === oldBeats[0].uuid);

      // Remove selected beats
      this.removeBeats(oldBeats);

      // Paste copied data into bar
      const newBeatsCopies = [];
      for (const beat of newBeats) {
        newBeatsCopies.push(beat.deepCopy());
      }
      // Error: need to provide the index
      // of the beat AFTER WHICH the new beats
      // should be inserted
      bar.insertBeats(beatIndex - 1, newBeatsCopies);
    } else {
      // Replace all notes in selection with copied beats
      for (let i = 0; i < oldBeats.length; i++) {
        oldBeats[i].duration = newBeats[i].duration;
        for (let j = 0; j < this.guitar.stringsCount; j++) {
          oldBeats[i].notes[j].fret = newBeats[i].notes[j].fret;
        }
      }
    }
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @param bendPitch Bend pitch
   * @returns True if applied, false otherwise
   */
  private applyBend(
    barIndex: number,
    beatIndex: number,
    stringNum: number,
    bendPitch: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    // Create & apply bend
    const bendEffect = new GuitarEffect(GuitarEffectType.Bend, {
      bendPitch: bendPitch,
    });
    return guitarNote.addEffect(bendEffect);
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @param bendPitch Bend pitch
   * @param bendReleasePitch Bend release pitch
   * @returns True if applied, false otherwise
   */
  private applyBendAndRelease(
    barIndex: number,
    beatIndex: number,
    stringNum: number,
    bendPitch: number,
    bendReleasePitch: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    // Create & apply bend-and-release
    const bendEffect = new GuitarEffect(GuitarEffectType.BendAndRelease, {
      bendPitch: bendPitch,
      bendReleasePitch: bendReleasePitch,
    });
    return guitarNote.addEffect(bendEffect);
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @param prebendPitch Prebend pitch
   * @returns True if applied, false otherwise
   */
  private applyPrebend(
    barIndex: number,
    beatIndex: number,
    stringNum: number,
    prebendPitch: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    // Create & apply prebend
    const prebendEffect = new GuitarEffect(GuitarEffectType.Prebend, {
      prebendPitch: prebendPitch,
    });
    return guitarNote.addEffect(prebendEffect);
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @param prebendPitch Prebend pitch
   * @param bendReleasePitch Bend release pitch
   * @returns True if applied, false otherwise
   */
  private applyPrebendAndRelease(
    barIndex: number,
    beatIndex: number,
    stringNum: number,
    prebendPitch: number,
    bendReleasePitch: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    // Create & apply prebend-and-release
    const prebendAndReleaseEffect = new GuitarEffect(
      GuitarEffectType.PrebendAndRelease,
      {
        prebendPitch: prebendPitch,
        bendReleasePitch: bendReleasePitch,
      }
    );
    return guitarNote.addEffect(prebendAndReleaseEffect);
  }

  /**
   * Applies vibrato to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyVibrato(
    barIndex: number,
    beatIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    const vibratoEffect = new GuitarEffect(GuitarEffectType.Vibrato);
    return guitarNote.addEffect(vibratoEffect);
  }

  /**
   * Applies slide to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applySlide(
    barIndex: number,
    beatIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];
    const nextBeat = this.getNextBeat(barIndex, beatIndex);
    const nextNote =
      nextBeat === undefined ? undefined : nextBeat.notes[stringNum - 1];

    // Can't apply slide if current note is the last one
    if (nextNote === undefined) {
      return false;
    }

    // Can't apply slide to two same notes
    if (nextNote.fret === guitarNote.fret) {
      return false;
    }

    // Can't apply slide to non-existent notes
    if (nextNote.fret === undefined || guitarNote.fret === undefined) {
      return false;
    }

    // Create slide effect
    const nextHigher = nextNote.fret > guitarNote.fret;
    const slideEffect = new GuitarEffect(
      GuitarEffectType.Slide,
      new GuitarEffectOptions(undefined, undefined, undefined, nextHigher)
    );

    // Apply slide
    return guitarNote.addEffect(slideEffect);
  }

  /**
   * Applies hammer-on/pull-off to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyHammerOnOrPullOff(
    barIndex: number,
    beatIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];
    const nextBeat = this.getNextBeat(barIndex, beatIndex);
    const nextNote =
      nextBeat === undefined ? undefined : nextBeat.notes[stringNum - 1];

    // Can't apply hammer-on if current note is the last one
    if (nextNote === undefined) {
      return false;
    }

    // Create hammer-on effects
    const hammerOnStartEffect = new GuitarEffect(
      GuitarEffectType.HammerOnOrPullOff
    );

    // First apply hammer-on start
    return guitarNote.addEffect(hammerOnStartEffect);
  }

  /**
   * Applies pinch harmonic to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyPinchHarmonic(
    barIndex: number,
    beatIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    const phEffect = new GuitarEffect(GuitarEffectType.PinchHarmonic);
    return guitarNote.addEffect(phEffect);
  }

  /**
   * Applies natural harmonic to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyNaturalHarmonic(
    barIndex: number,
    beatIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    const nhEffect = new GuitarEffect(GuitarEffectType.NaturalHarmonic);
    return guitarNote.addEffect(nhEffect);
  }

  /**
   * Applies palm mute to a note
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyPalmMute(
    barIndex: number,
    beatIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];

    const pmEffect = new GuitarEffect(GuitarEffectType.PalmMute);
    return guitarNote.addEffect(pmEffect);
  }

  /**
   * Applies specified effect
   * @param barIndex Bar index
   * @param beatIndex Beat index
   * @param stringNum String number
   * @param effect Effect to apply
   * @returns True if effect applied or no note to apply effect to, false
   * if effect inapplicable to specified note
   */
  public applyEffectToNote(
    barIndex: number,
    beatIndex: number,
    stringNum: number,
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    const note =
      this._bars[barIndex].beats[beatIndex].notes[stringNum - 1].note;
    if (
      note.noteValue === NoteValue.None ||
      note.noteValue === NoteValue.Dead
    ) {
      // No effects can be applied to a dead note or an abscense of a note
      return true;
    }

    // Below exclamation marks are used
    // This is bad, need to refactor
    switch (effectType) {
      case GuitarEffectType.Bend:
        return this.applyBend(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions!.bendPitch!
        );
      case GuitarEffectType.BendAndRelease:
        return this.applyBendAndRelease(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions!.bendPitch!,
          effectOptions!.bendReleasePitch!
        );
      case GuitarEffectType.Prebend:
        return this.applyPrebend(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions!.prebendPitch!
        );
      case GuitarEffectType.PrebendAndRelease:
        return this.applyPrebendAndRelease(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions!.prebendPitch!,
          effectOptions!.bendReleasePitch!
        );
      case GuitarEffectType.Vibrato:
        return this.applyVibrato(barIndex, beatIndex, stringNum);
      case GuitarEffectType.Slide:
        return this.applySlide(barIndex, beatIndex, stringNum);
      case GuitarEffectType.HammerOnOrPullOff:
        return this.applyHammerOnOrPullOff(barIndex, beatIndex, stringNum);
      case GuitarEffectType.PinchHarmonic:
        return this.applyPinchHarmonic(barIndex, beatIndex, stringNum);
      case GuitarEffectType.NaturalHarmonic:
        return this.applyNaturalHarmonic(barIndex, beatIndex, stringNum);
      case GuitarEffectType.PalmMute:
        return this.applyPalmMute(barIndex, beatIndex, stringNum);
    }
  }

  public removeEffectFromNote(
    barIndex: number,
    beatIndex: number,
    stringNum: number,
    effectIndex: number
  ): void {
    const note = this._bars[barIndex].beats[beatIndex].notes[stringNum - 1];
    if (note.effects.length === 0) {
      return;
    }

    note.effects.splice(effectIndex, 1);
  }

  /**
   * Applies effects to all notes in specified beats
   * @param beats Beats array
   * @param effect Effect to apply
   * @returns True if the effect applied to all notes
   */
  public applyEffectToBeats(
    beats: Beat[],
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    let appliedToAll = true;
    for (const beat of beats) {
      let barIndex: number = -1;
      let beatIndex: number = -1;
      this._bars.findIndex((b, i) => {
        return b.beats.some((c, j) => {
          barIndex = i;
          beatIndex = j;
          return c.uuid === beat.uuid;
        });
      });

      if (barIndex === -1 || beatIndex === -1) {
        throw Error("Could not find beat indices");
      }

      for (const note of beat.notes) {
        const applyRes = this.applyEffectToNote(
          barIndex,
          beatIndex,
          note.stringNum,
          effectType,
          effectOptions
        );

        if (!applyRes) {
          appliedToAll = false;
        }
      }
    }

    return appliedToAll;
  }

  /**
   * Get next beat in the tab
   * @param barIndex Bar index
   * @param beatIndex Beat index (inside the bar)
   * @returns Beat (or undefined if can't get next beat)
   */
  public getNextBeat(barIndex: number, beatIndex: number): Beat | undefined {
    const beatsSeq = this.getBeatsSeq();
    const beatSeqIndex = beatsSeq.indexOf(
      this._bars[barIndex].beats[beatIndex]
    );
    return beatSeqIndex === beatsSeq.length - 1
      ? undefined
      : beatsSeq[beatIndex + 1];
  }

  /**
   * Get next beat in the tab
   * @param barIndex Bar index
   * @param beatIndex Beat index (inside the bar)
   * @returns Beat (or undefined if can't get next beat)
   */
  public getPrevBeat(barIndex: number, beatIndex: number): Beat | undefined {
    const beatsSeq = this.getBeatsSeq();
    const beatSeqIndex = beatsSeq.indexOf(
      this._bars[barIndex].beats[beatIndex]
    );
    return beatSeqIndex === 0 ? undefined : beatsSeq[beatIndex - 1];
  }

  /**
   * All the beats as an array. Does a flat map, so consider performance
   */
  public getBeatsSeq(): Beat[] {
    return this._bars.flatMap((bar) => {
      return bar.beats;
    });
  }

  public getNotesSeq(): GuitarNote[] {
    const beatsSeq = this.getBeatsSeq();
    return beatsSeq.flatMap((beat) => {
      return beat.notes;
    });
  }

  public findBarByUUID(barUUID: number): Bar | undefined {
    return this._bars.find((bar) => {
      return bar.uuid === barUUID;
    });
  }

  public findBeatByUUID(beatUUID: number): Beat | undefined {
    const beatsSeq = this.getBeatsSeq();
    return beatsSeq.find((beat) => {
      return beat.uuid === beatUUID;
    });
  }

  public findNoteByUUID(noteUUID: number): GuitarNote | undefined {
    const notesSeq = this.getNotesSeq();
    return notesSeq.find((note) => {
      return note.uuid === noteUUID;
    });
  }

  public findBeatsBar(beat: Beat): Bar {
    const bar = this._bars.find((b) => {
      return b.beats.includes(beat);
    });

    if (bar === undefined) {
      throw Error("Beat is not in the tab");
    }

    return bar;
  }

  public findNotesBeat(note: GuitarNote): Beat {
    const beatsSeq = this.getBeatsSeq();

    const beat = beatsSeq.find((b) => {
      return b.notes.includes(note);
    });

    if (beat === undefined) {
      throw Error("Note is not in the tab");
    }

    return beat;
  }

  public findNotesBar(note: GuitarNote): Bar {
    return this.findBeatsBar(this.findNotesBeat(note));
  }

  public deepCopy(): Tab {
    const barsCopies = [];
    for (const bar of this._bars) {
      barsCopies.push(bar.deepCopy());
    }

    return new Tab(this.name, this.instrumentName, this.guitar, barsCopies);
  }

  public get bars(): ReadonlyArray<Bar> {
    return this._bars;
  }

  /**
   * Parses tab into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object {
    const barsJSON = [];
    for (const bar of this._bars) {
      barsJSON.push(bar.toJSONObj());
    }

    return {
      name: this.name,
      instrumentName: this.instrumentName,
      guitar: this.guitar.toJSONObj(),
      bars: barsJSON,
    };
  }

  /**
   * Parses tab into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }

  /**
   * Parses a JSON object into a Tab class object
   * @param obj JSON object to parse
   * @returns Parsed Tab object
   */
  static fromJSON(obj: any): Tab {
    if (
      obj.name === undefined ||
      obj.instrumentName === undefined ||
      obj.guitar === undefined ||
      obj.bars === undefined
    ) {
      throw Error(
        `Invalid JSON to parse into tab, obj: ${JSON.stringify(obj)}`
      );
    }

    const guitar = Guitar.fromJSON(obj.guitar);

    const bars: Bar[] = [];
    for (const bar of obj.bars) {
      bars.push(Bar.fromJSON(guitar, bar));
    }

    return new Tab(obj.name, obj.instrumentName, guitar, bars);
  }
}
