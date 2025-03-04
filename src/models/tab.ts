import { Bar } from "./bar";
import { Chord } from "./chord";
import { Guitar } from "./guitar";
import {
  GuitarEffect,
  GuitarEffectOptions,
  GuitarEffectType,
} from "./guitar-effect";
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

    if (bars) {
      this.bars = bars;
    } else {
      this.bars = [
        new Bar(this.guitar, 120, 4, NoteDuration.Quarter, undefined),
      ];
    }
  }

  /**
   * Removes chord from tab
   * @param chordToRemove Chord to remove
   */
  public removeChord(chordToRemove: Chord): void {
    // remove chord based on the bar id
    // get bar id using chord uuid
    const bar = this.bars.filter((bar) => {
      return bar.chords.some((chord) => {
        return chord.uuid === chordToRemove.uuid;
      });
    })[0];
    const insideBarIndex = bar.chords.findIndex(
      (chord) => chord.uuid === chordToRemove.uuid
    );
    bar.removeChord(insideBarIndex);
  }

  /**
   * Removes chords from tab
   * @param chords Chords to remove
   */
  public removeChords(chords: Chord[]): void {
    for (const chord of chords) {
      this.removeChord(chord);
    }
  }

  /**
   * Replaces chord section with another chord section
   * @param oldChords Old chords
   * @param newChords New chords
   */
  public replaceChords(oldChords: Chord[], newChords: Chord[]): void {
    if (oldChords.length > newChords.length) {
      // Replace chords' notes values
      for (let i = 0; i < newChords.length; i++) {
        for (let j = 0; j < this.guitar.stringsCount; j++) {
          oldChords[i].notes[j].fret = newChords[i].notes[j].fret;
        }
      }

      // Remove 'excess' chords
      this.removeChords(oldChords.slice(newChords.length, oldChords.length));
    } else if (oldChords.length < newChords.length) {
      // Get starting bar for later usage
      const bar = this.bars.filter((bar) => {
        return bar.chords.some((chord) => {
          return chord.uuid === oldChords[0].uuid;
        });
      })[0];

      // Remove selected chords
      this.removeChords(oldChords);

      // Paste copied data into bar
      bar.insertChords(bar.chords.length - 1, newChords);
    } else {
      // Replace all notes in selection with copied chords
      for (let i = 0; i < oldChords.length; i++) {
        for (let j = 0; j < this.guitar.stringsCount; j++) {
          oldChords[i].notes[j].fret = newChords[i].notes[j].fret;
        }
      }
    }
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @param bendPitch Bend pitch
   * @returns True if applied, false otherwise
   */
  private applyBend(
    barIndex: number,
    chordIndex: number,
    stringNum: number,
    bendPitch: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

    // Create & apply bend
    const bendEffect = new GuitarEffect(GuitarEffectType.Bend, {
      bendPitch: bendPitch,
    });
    return guitarNote.addEffect(bendEffect);
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @param bendPitch Bend pitch
   * @param bendReleasePitch Bend release pitch
   * @returns True if applied, false otherwise
   */
  private applyBendAndRelease(
    barIndex: number,
    chordIndex: number,
    stringNum: number,
    bendPitch: number,
    bendReleasePitch: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

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
   * @param chordIndex Chord index
   * @param stringNum String number
   * @param prebendPitch Prebend pitch
   * @returns True if applied, false otherwise
   */
  private applyPrebend(
    barIndex: number,
    chordIndex: number,
    stringNum: number,
    prebendPitch: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

    // Create & apply prebend
    const prebendEffect = new GuitarEffect(GuitarEffectType.Prebend, {
      prebendPitch: prebendPitch,
    });
    return guitarNote.addEffect(prebendEffect);
  }

  /**
   * Applies bend to a note
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @param prebendPitch Prebend pitch
   * @param bendReleasePitch Bend release pitch
   * @returns True if applied, false otherwise
   */
  private applyPrebendAndRelease(
    barIndex: number,
    chordIndex: number,
    stringNum: number,
    prebendPitch: number,
    bendReleasePitch: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

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
   * @param chordIndex Chord index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyVibrato(
    barIndex: number,
    chordIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

    const vibratoEffect = new GuitarEffect(GuitarEffectType.Vibrato);
    return guitarNote.addEffect(vibratoEffect);
  }

  /**
   * Applies slide to a note
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applySlide(
    barIndex: number,
    chordIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];
    const nextChord = this.getNextChord(barIndex, chordIndex);
    const nextNote =
      nextChord === undefined ? undefined : nextChord.notes[stringNum - 1];

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
   * @param chordIndex Chord index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyHammerOnOrPullOff(
    barIndex: number,
    chordIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];
    const nextChord = this.getNextChord(barIndex, chordIndex);
    const nextNote =
      nextChord === undefined ? undefined : nextChord.notes[stringNum - 1];

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
   * @param chordIndex Chord index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyPinchHarmonic(
    barIndex: number,
    chordIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

    const phEffect = new GuitarEffect(GuitarEffectType.PinchHarmonic);
    return guitarNote.addEffect(phEffect);
  }

  /**
   * Applies natural harmonic to a note
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyNaturalHarmonic(
    barIndex: number,
    chordIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

    const nhEffect = new GuitarEffect(GuitarEffectType.NaturalHarmonic);
    return guitarNote.addEffect(nhEffect);
  }

  /**
   * Applies palm mute to a note
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @returns True if applied, false otherwise
   */
  private applyPalmMute(
    barIndex: number,
    chordIndex: number,
    stringNum: number
  ): boolean {
    const guitarNote =
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1];

    const pmEffect = new GuitarEffect(GuitarEffectType.PalmMute);
    return guitarNote.addEffect(pmEffect);
  }

  /**
   * Applies specified effect
   * @param barIndex Bar index
   * @param chordIndex Chord index
   * @param stringNum String number
   * @param effect Effect to apply
   * @returns True if effect applied or no note to apply effect to, false
   * if effect inapplicable to specified note
   */
  public applyEffectToNote(
    barIndex: number,
    chordIndex: number,
    stringNum: number,
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    if (
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1].note ===
        Note.None ||
      this.bars[barIndex].chords[chordIndex].notes[stringNum - 1].note ===
        Note.Dead
    ) {
      // No effects can be applied to a dead note or an abscense of a note
      return true;
    }

    switch (effectType) {
      case GuitarEffectType.Bend:
        return this.applyBend(
          barIndex,
          chordIndex,
          stringNum,
          effectOptions.bendPitch
        );
      case GuitarEffectType.BendAndRelease:
        return this.applyBendAndRelease(
          barIndex,
          chordIndex,
          stringNum,
          effectOptions.bendPitch,
          effectOptions.bendReleasePitch
        );
      case GuitarEffectType.Prebend:
        return this.applyPrebend(
          barIndex,
          chordIndex,
          stringNum,
          effectOptions.prebendPitch
        );
      case GuitarEffectType.PrebendAndRelease:
        return this.applyPrebendAndRelease(
          barIndex,
          chordIndex,
          stringNum,
          effectOptions.prebendPitch,
          effectOptions.bendReleasePitch
        );
      case GuitarEffectType.Vibrato:
        return this.applyVibrato(barIndex, chordIndex, stringNum);
      case GuitarEffectType.Slide:
        return this.applySlide(barIndex, chordIndex, stringNum);
      case GuitarEffectType.HammerOnOrPullOff:
        return this.applyHammerOnOrPullOff(barIndex, chordIndex, stringNum);
      case GuitarEffectType.PinchHarmonic:
        return this.applyPinchHarmonic(barIndex, chordIndex, stringNum);
      case GuitarEffectType.NaturalHarmonic:
        return this.applyNaturalHarmonic(barIndex, chordIndex, stringNum);
      case GuitarEffectType.PalmMute:
        return this.applyPalmMute(barIndex, chordIndex, stringNum);
    }
  }

  /**
   * Applies effects to all notes in specified chords
   * @param chords Chords array
   * @param effect Effect to apply
   * @returns True if the effect applied to all notes
   */
  public applyEffectToChords(
    chords: Chord[],
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    let appliedToAll = true;
    for (const chord of chords) {
      let barIndex: number;
      let chordIndex: number;
      this.bars.findIndex((b, i) => {
        return b.chords.some((c, j) => {
          barIndex = i;
          chordIndex = j;
          return c.uuid === chord.uuid;
        });
      });

      for (const note of chord.notes) {
        const applyRes = this.applyEffectToNote(
          barIndex,
          chordIndex,
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
   * Get next chord in the tab
   * @param barIndex Bar index
   * @param chordIndex Chord index (inside the bar)
   * @returns Chord (or undefined if can't get next chord)
   */
  public getNextChord(barIndex: number, chordIndex: number): Chord | undefined {
    const chordsSeq = this.getChordsSeq();
    const chordSeqIndex = chordsSeq.indexOf(
      this.bars[barIndex].chords[chordIndex]
    );
    return chordSeqIndex === chordsSeq.length - 1
      ? undefined
      : chordsSeq[chordIndex + 1];
  }

  /**
   * Get next chord in the tab
   * @param barIndex Bar index
   * @param chordIndex Chord index (inside the bar)
   * @returns Chord (or undefined if can't get next chord)
   */
  public getPrevChord(barIndex: number, chordIndex: number): Chord | undefined {
    const chordsSeq = this.getChordsSeq();
    const chordSeqIndex = chordsSeq.indexOf(
      this.bars[barIndex].chords[chordIndex]
    );
    return chordSeqIndex === 0 ? undefined : chordsSeq[chordIndex - 1];
  }

  /**
   * All the chords as an array. Does a flat map, so consider performance
   */
  public getChordsSeq(): Chord[] {
    return this.bars.flatMap((bar) => {
      return bar.chords;
    });
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
