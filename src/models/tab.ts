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
      obj.bars == undefined
    ) {
      throw new Error("Invalid js obj to parse to tab");
    }

    obj.guitar =
      typeof obj.guitar === "string" ? JSON.parse(obj.guitar) : obj.guitar;
    obj.bars = typeof obj.bars === "string" ? JSON.parse(obj.bars) : obj.bars;

    let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    let tab = new Tab(obj.id, obj.name, obj.artist, obj.song, guitar); // Create tab instance
    tab.bars.length = 0; // Delete default bars
    obj.bars.forEach((bar: any) => tab.bars.push(Bar.fromObject(bar))); // Parse bars
    return tab;
  }
}
