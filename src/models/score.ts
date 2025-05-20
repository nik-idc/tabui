import { Tab } from "./tab";
import { Track } from "./track";

/**
 * Class for a score for a song. Contains all the tracks for the song
 */
export class Score {
  /**
   * Class for a score for a song. Contains all the tracks for the song
   */
  constructor(
    /**
     * Score's id
     */
    readonly id: number,
    /**
     * Score's song artist
     */
    public artist: string,
    /**
     * Score's song name
     */
    public songName: string,
    /**
     * Public status
     */
    readonly isPublic: boolean,
    /**
     * Score's name
     */
    public name?: string,
    /**
     * Score's trakcs. NOTE: For now only support guitar tabs.
     * In the far, far future support for classical musical notation &
     * thus non-guitar tracks will be added (hopefully)
     */
    readonly tracks?: Tab[]
  ) {}

  /**
   * Create a Score object from a JSON object
   * @param obj JSON object to parse into Score
   */
  static fromObject(obj: any): Score {
    if (
      obj.id === undefined ||
      obj.artist === undefined ||
      obj.songName === undefined ||
      obj.isPublic === undefined
    ) {
      throw Error("Invalid js obj to parse to score");
    }

    // TODO: Check types but I'm lazy and in a hurry

    const tracks: Tab[] = [];
    if (obj.tracks !== undefined) {
      for (const track of obj.tracks) {
        tracks.push(Tab.fromObject(track));
      }
    }

    return new Score(
      obj.id,
      obj.artist,
      obj.songName,
      obj.isPublic,
      obj.name,
      tracks
    );
  }
}
