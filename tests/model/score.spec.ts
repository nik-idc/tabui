import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  Score,
  Track,
} from "../../src/notation/model";

describe("Score model", () => {
  test("new Score creates at least one master bar, track, staff and bar", () => {
    const score = new Score();

    expect(score.masterBars).toHaveLength(1);
    expect(score.tracks).toHaveLength(1);
    expect(score.tracks[0].staves).toHaveLength(1);
    expect(score.tracks[0].staves[0].bars).toHaveLength(1);
  });

  test("insertReadyMasterBar inserts the master bar at the requested index", () => {
    const score = new Score();
    const track = score.tracks[0];
    const staff = track.staves[0];

    const first = score.masterBars[0];
    const second = score.appendMasterBar(DEFAULT_MASTER_BAR).masterBar;
    const inserted = score.appendMasterBar(DEFAULT_MASTER_BAR).masterBar;
    const insertedBar = new Bar(staff, track.context, inserted);

    score.masterBars.pop();
    const bars = new Map<number, Bar>([[staff.uuid, insertedBar]]);

    score.insertReadyMasterBar(1, inserted, bars);

    expect(score.masterBars).toEqual([first, inserted, second]);
    expect(staff.bars[1]).toBe(insertedBar);
  });

  test("removeTrack removes exactly one track", () => {
    const score = new Score();
    const track1 = score.tracks[0];
    const track2 = new Track(score, new Guitar(), "Track 2");
    const track3 = new Track(score, new Guitar(), "Track 3");
    score.tracks.push(track2, track3);

    const selectedTrack = score.removeTrack(1);

    expect(selectedTrack).toBe(track1);
    expect(score.tracks).toEqual([track1, track3]);
  });

  test("removeTrack throws when removing the last remaining track", () => {
    const score = new Score();

    expect(() => score.removeTrack(0)).toThrow(
      "Empty score currently unhandled"
    );
  });

  test("removeMasterBar throws when removing the last remaining master bar", () => {
    const score = new Score();

    expect(() => score.removeMasterBar(0)).toThrow(
      "Score must have at least one master bar"
    );
  });
});
