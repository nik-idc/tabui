import { Bar } from "./bar";
import { Guitar } from "./guitar";
import { Tab } from "./tab";
import { Track } from "./track";

/**
 * Class for a score for a song. Contains all the tracks for the song
 */
export class Score {
  /**
   * Score's id
   */
  readonly id: number;
  /**
   * Score's name
   */
  public name: string;
  /**
   * Score's song artist
   */
  public artist: string;
  /**
   * Score's song name
   */
  public song: string;
  /**
   * Public status
   */
  readonly isPublic: boolean;
  /**
   * Score's trakcs. NOTE: For now only support guitar tabs.
   * In the far, far future support for classical musical notation &
   * thus non-guitar tracks will be added (hopefully)
   */
  readonly tracks: Tab[];

  /**
   * Class for a score for a song. Contains all the tracks for the song
   */
  constructor(
    id: number = -1,
    name: string = "Unknown",
    artist: string = "Unknown artist",
    song: string = "Unknown song",
    isPublic: boolean = false,
    tracks: Tab[] = [new Tab()]
  ) {
    this.id = id;
    this.name = name;
    this.artist = artist;
    this.song = song;
    this.isPublic = isPublic;
    this.tracks = tracks;
  }

  /**
   * Adds a tab in the score
   * @param guitar Guitar
   * @param name Tab name
   * @param instrumentName Name of the instrument
   */
  public addTab(
    guitar: Guitar,
    name: string = "New tab",
    instrumentName: string = "Guitar"
  ): void {
    // THIS IS VERY BAD FOR FOLLOWING REASONS:
    //  1. This assumes that appending/inserting/deleting bars from the Score class
    //     will work correctly EVERY TIME which I can't ever be 100% sure in
    //  2. Bars in general should be more of a track-independent entity since EVERY bar
    //     that exists in one track HAS to exist in all the others hinting that the more  appropriate
    //     structure would look like this: Score.bars[barIndex].track[trackIndex].beats...
    // But for now this will do
    const barsCount = this.tracks[0].bars.length;

    const emptyBars: Bar[] = [];
    for (let i = 0; i < barsCount; i++) {
      emptyBars.push(
        new Bar(
          guitar,
          this.tracks[0].bars[i].tempo,
          this.tracks[0].bars[i].beatsCount,
          this.tracks[0].bars[i].duration,
          []
        )
      );
    }

    this.tracks.push(new Tab(name, instrumentName, guitar, emptyBars));
  }

  /**
   * Prepends the provided bar to the tab at index 'tabIndex'
   * and prepends a new empty bar to every other track
   * @param tabIndex Tab index
   * @param bar Bar to append
   */
  public prependBar(tabIndex: number, bar?: Bar): void {
    if (tabIndex < 0 || tabIndex >= this.tracks.length) {
      throw Error(`Invalid tab index: '${tabIndex}'`);
    }

    for (let i = 0; i < this.tracks.length; i++) {
      if (i === tabIndex) {
        this.tracks[i].prependBar(bar);
      } else {
        this.tracks[i].prependBar();
      }
    }
  }

  /**
   * Appends the provided bar to the tab at index 'tabIndex'
   * and appends a new empty bar to every other track
   * @param tabIndex Tab index
   * @param bar Bar to append
   */
  public appendBar(tabIndex: number, bar?: Bar): void {
    if (tabIndex < 0 || tabIndex >= this.tracks.length) {
      throw Error(`Invalid tab index: '${tabIndex}'`);
    }

    for (let i = 0; i < this.tracks.length; i++) {
      if (i === tabIndex) {
        this.tracks[i].appendBar(bar);
      } else {
        this.tracks[i].appendBar();
      }
    }
  }

  /**
   * Inserts the provided bar to the tab at index 'tabIndex'
   * and inserts a new empty bar to every other track
   * @param tabIndex Tab index
   * @param barIndex Bar index (Inserts BEFORE specified index)
   * @param bar Bar to insert
   */
  public insertBar(tabIndex: number, barIndex: number, bar?: Bar): void {
    if (tabIndex < 0 || tabIndex >= this.tracks.length) {
      throw Error(`Invalid tab index: '${tabIndex}'`);
    }

    const barsCount = this.tracks[0].bars.length;
    if (barIndex < 0 || barIndex > barsCount) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    for (let i = 0; i < this.tracks.length; i++) {
      if (i === tabIndex) {
        this.tracks[i].insertBar(barIndex, bar);
      } else {
        this.tracks[i].insertBar(barIndex);
      }
    }
  }

  /**
   * Removes bar from the score
   * @param barIndex Index of the bar to remove
   */
  public removeBar(barIndex: number): void {
    const barsCount = this.tracks[0].bars.length;
    if (barIndex < 0 || barIndex > barsCount - 1) {
      throw Error(`Can't remove bar at index ${barIndex}`);
    }

    for (const track of this.tracks) {
      track.removeBar(barIndex);
    }
  }

  /**
   * Create a Score object from a JSON object
   * @param obj JSON object to parse into Score
   */
  static fromObject(obj: any): Score {
    if (
      obj.id === undefined ||
      obj.name === undefined ||
      obj.artist === undefined ||
      obj.song === undefined ||
      obj.isPublic === undefined ||
      obj.tracks === undefined
    ) {
      throw Error("Invalid js obj to parse to score");
    }

    // TODO: Check types but I'm lazy and in a hurry

    const tracks: Tab[] = [];
    for (const track of obj.tracks) {
      tracks.push(Tab.fromObject(track));
    }

    return new Score(
      obj.id,
      obj.name,
      obj.artist,
      obj.song,
      obj.isPublic,
      tracks
    );
  }
}
