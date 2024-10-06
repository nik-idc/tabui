import { Bar } from "./bar";
import { Chord } from "./chord";
import { Guitar } from "./guitar";
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

  public removeChords(chords: Chord[]): void {
    for (const chord of chords) {
      this.removeChord(chord);
    }
  }

  public replaceChords(selChords: Chord[], newChords: Chord[]): void {
    if (selChords.length > newChords.length) {
      // Replace chords' notes values
      for (let i = 0; i < newChords.length; i++) {
        for (let j = 0; j < this.guitar.stringsCount; j++) {
          selChords[i].notes[j].fret = newChords[i].notes[j].fret;
        }
      }

      // Remove 'excess' chords
      this.removeChords(selChords.slice(newChords.length, selChords.length));
    } else if (selChords.length < newChords.length) {
      // Get starting bar for later usage
      const bar = this.bars.filter((bar) => {
        return bar.chords.some((chord) => {
          return chord.uuid === selChords[0].uuid;
        });
      })[0];

      // Remove selected chords
      this.removeChords(selChords);

      // Paste copied data into bar
      bar.insertChords(bar.chords.length - 1, newChords);
    } else {
      // Replace all notes in selection with copied chords
      for (let i = 0; i < selChords.length; i++) {
        for (let j = 0; j < this.guitar.stringsCount; j++) {
          selChords[i].notes[j].fret = newChords[i].notes[j].fret;
        }
      }
    }
  }

  /**
   * Full song name
   */
  get fullSongName(): string {
    return this.artist + "-" + this.song;
  }

  get chordsSeq(): Chord[] {
    return this.bars.flatMap((bar) => {
      return bar.chords;
    });
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
      throw new Error("Invalid js obj to parse to tab");
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

    // obj.guitar =
    //   typeof obj.guitar === "string" ? JSON.parse(obj.guitar) : obj.guitar;
    // obj.data = typeof obj.data === "string" ? JSON.parse(obj.data) : obj.data;

    // let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    // let tab = new Tab(obj.id, obj.name, obj.artist, obj.song, guitar); // Create tab instance
    // tab.bars.length = 0; // Delete default bars
    // obj.bars.forEach((bar: any) => tab.bars.push(Bar.fromObject(bar))); // Parse bars
    // return tab;
  }
}
