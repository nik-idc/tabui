import { Bar } from "./bar";
import { Chord } from "./chord";
import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { Note } from "./note";
import { NoteDuration } from "./note-duration";

export class Tab {
  readonly id: number | undefined;
  public artist: string;
  public song: string;
  readonly guitar: Guitar;
  readonly bars: Bar[];
  readonly isPublic: boolean;

  constructor(
    id: number | undefined = undefined,
    artist: string = "Unknown artist",
    song: string = "Unknown song",
    guitar: Guitar = new Guitar(),
    bars: Bar[] | undefined = undefined,
    isPublic: boolean = false
  ) {
    this.id = id;
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

  get name(): string {
    return this.artist + "-" + this.song;
  }

  static fromObject(obj: any): Tab {
    if (
      obj.id == undefined ||
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
    let tab = new Tab(obj.id, obj.artist, obj.song, guitar); // Create tab instance
    tab.bars.length = 0; // Delete default bars
    obj.bars.forEach((bar: any) => tab.bars.push(Bar.fromObject(bar))); // Parse bars
    return tab;
  }
}
