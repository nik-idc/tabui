import { Bar } from "./bar";
import { Beat } from "./beat";
import { Guitar } from "./guitar";
import { GuitarEffect } from "./guitar-effect/guitar-effect";
import { GuitarEffectOptions } from "./guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "./guitar-effect/guitar-effect-type";
import { GuitarNote } from "./guitar-note";
import { Note } from "./note";
import { NoteDuration } from "./note-duration";

/**
 * Class that represents a guitar tab
 */
export class Tab {
  /**
   * Tab id
   */
  readonly id: number | undefined;
  /**
   * Tab name
   */
  public name: string;
  /**
   * Artist
   */
  public artist: string;
  /**
   * Song
   */
  public song: string;
  /**
   * Guitar
   */
  readonly guitar: Guitar;
  /**
   * Bars of the tab
   */
  readonly bars: Bar[];
  /**
   * Public status
   */
  readonly isPublic: boolean;

  /**
   * Class that represents a guitar tab
   * @param id Tab id
   * @param name Tab name
   * @param artist Artist
   * @param song Song
   * @param guitar Guitar
   * @param bars Bars of the tab
   * @param isPublic Public status
   */
  constructor(
    id: number | undefined = undefined,
    name: string = "Unnamed",
    artist: string = "Unknown artist",
    song: string = "Unknown song",
    guitar: Guitar = new Guitar(),
    bars: Bar[] | undefined = undefined,
    isPublic: boolean = false
  ) {
    this.id = id;
    this.name = name;
    this.artist = artist;
    this.song = song;
    this.guitar = guitar;
    this.isPublic = isPublic;

    if (bars === undefined || bars.length === 0) {
      this.bars = [
        new Bar(this.guitar, 120, 4, NoteDuration.Quarter, undefined),
      ];
    } else {
      this.bars = bars;
    }
  }

  /**
   * Removes beat from tab
   * @param beatToRemove Beat to remove
   */
  public removeBeat(beatToRemove: Beat): void {
    // remove beat based on the bar id
    // get bar id using beat uuid
    const bar = this.bars.filter((bar) => {
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
      const bar = this.bars.filter((bar) => {
        return bar.beats.some((beat) => {
          return beat.uuid === oldBeats[0].uuid;
        });
      })[0];

      // Remove selected beats
      this.removeBeats(oldBeats);

      // Paste copied data into bar
      const newBeatsCopies = [];
      for (const beat of newBeats) {
        newBeatsCopies.push(beat.deepCopy());
      }
      bar.insertBeats(bar.beats.length - 1, newBeatsCopies);
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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];
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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];
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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];

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
    if (
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1].note ===
        Note.None ||
      this.bars[barIndex].beats[beatIndex].notes[stringNum - 1].note ===
        Note.Dead
    ) {
      // No effects can be applied to a dead note or an abscense of a note
      return true;
    }

    switch (effectType) {
      case GuitarEffectType.Bend:
        return this.applyBend(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions.bendPitch
        );
      case GuitarEffectType.BendAndRelease:
        return this.applyBendAndRelease(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions.bendPitch,
          effectOptions.bendReleasePitch
        );
      case GuitarEffectType.Prebend:
        return this.applyPrebend(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions.prebendPitch
        );
      case GuitarEffectType.PrebendAndRelease:
        return this.applyPrebendAndRelease(
          barIndex,
          beatIndex,
          stringNum,
          effectOptions.prebendPitch,
          effectOptions.bendReleasePitch
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
    const note = this.bars[barIndex].beats[beatIndex].notes[stringNum - 1];
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
      let barIndex: number;
      let beatIndex: number;
      this.bars.findIndex((b, i) => {
        return b.beats.some((c, j) => {
          barIndex = i;
          beatIndex = j;
          return c.uuid === beat.uuid;
        });
      });

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
    const beatSeqIndex = beatsSeq.indexOf(this.bars[barIndex].beats[beatIndex]);
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
    const beatSeqIndex = beatsSeq.indexOf(this.bars[barIndex].beats[beatIndex]);
    return beatSeqIndex === 0 ? undefined : beatsSeq[beatIndex - 1];
  }

  /**
   * All the beats as an array. Does a flat map, so consider performance
   */
  public getBeatsSeq(): Beat[] {
    return this.bars.flatMap((bar) => {
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
    return this.bars.find((bar) => {
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

  public deepCopy(): Tab {
    const barsCopies = [];
    for (const bar of this.bars) {
      barsCopies.push(bar.deepCopy());
    }

    return new Tab(
      this.id,
      this.name,
      this.artist,
      this.song,
      this.guitar,
      barsCopies,
      this.isPublic
    );
  }

  /**
   * Full song name
   */
  get fullSongName(): string {
    return this.artist + "-" + this.song;
  }

  /**
   * Parses a JSON object into a Tab class object
   * @param obj JSON object to parse
   * @returns Parsed Tab object
   */
  static fromObject(obj: any): Tab {
    if (
      obj.id == undefined ||
      obj.name == undefined ||
      obj.artist == undefined ||
      obj.song == undefined ||
      obj.guitar == undefined ||
      obj.data == undefined
    ) {
      throw Error("Invalid js obj to parse to tab");
    }

    return new Tab(
      obj.id,
      obj.name,
      obj.artist,
      obj.song,
      obj.guitar,
      obj.data.bars,
      obj.isPublic
    );
  }
}
