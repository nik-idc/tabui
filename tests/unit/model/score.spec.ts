import {
  DEFAULT_MASTER_BAR,
  Guitar,
  Score,
  Track,
} from "../../../src/notation/model";

describe("Score model", () => {
  test("new Score creates one master bar, track, staff and bar", () => {
    const score = new Score();

    expect(score.masterBars).toHaveLength(1);
    expect(score.tracks).toHaveLength(1);
    expect(score.tracks[0].staves).toHaveLength(1);
    expect(score.tracks[0].staves[0].bars).toHaveLength(1);
    expect(score.masterVolume).toBe(1);
    expect(score.masterPan).toBe(0);
  });

  test("addTrack creates an aligned track with one default staff", () => {
    const score = new Score();

    const output = score.addTrack(new Guitar(), "Track 2");
    const track = output.tracks[0];

    expect(output.index).toBe(1);
    expect(score.tracks).toHaveLength(2);
    expect(track.staves).toHaveLength(1);
    expect(score.tracks[1]).toBe(track);
    expect(track.staves[0].bars).toHaveLength(1);
    expect(track.staves[0].bars[0].masterBar).toBe(score.masterBars[0]);
  });

  test("insertReadyMasterBar inserts the master bar at the requested index", () => {
    const score = new Score();
    const track = score.tracks[0];
    const staff = track.staves[0];

    const first = score.masterBars[0];
    const inserted = score.appendMasterBar(DEFAULT_MASTER_BAR).masterBar;
    const second = score.appendMasterBar(DEFAULT_MASTER_BAR).masterBar;
    const originalBars = [...staff.bars];
    const removed = score.removeMasterBar(1);

    score.insertReadyMasterBar(1, removed.masterBar, removed.bars);

    expect(score.masterBars).toEqual([first, inserted, second]);
    expect(staff.bars).toHaveLength(3);
    expect(staff.bars[0]).toBe(originalBars[0]);
    expect(staff.bars[1]).toBe(originalBars[1]);
    expect(staff.bars[2]).toBe(originalBars[2]);
  });

  test("removeTrack removes the requested track and returns its neighbor", () => {
    const score = new Score();
    const track1 = score.tracks[0];
    score.addTrack(new Guitar(), "Track 2");
    const track3 = score.addTrack(new Guitar(), "Track 3").tracks[0];

    const selectedTrack = score.removeTrack(1);

    expect(selectedTrack).toBe(track1);
    expect(score.tracks).toEqual([track1, track3]);
  });

  test("removeTrack throws when removing the last remaining track", () => {
    const score = new Score();
    const track = score.tracks[0];

    expect(() => score.removeTrack(0)).toThrow(Error);
    expect(score.tracks).toEqual([track]);
  });

  test("moveTrack moves an existing track to the target index", () => {
    const score = new Score();
    const track1 = score.tracks[0];
    const track2 = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const track3 = score.addTrack(new Guitar(), "Track 3").tracks[0];

    score.moveTrack(track3, 0);

    expect(score.tracks).toEqual([track3, track1, track2]);
  });

  test("moveTrack throws for tracks and target indices outside the score", () => {
    const score = new Score();
    const foreignTrack = new Track(score, new Guitar(), "Foreign");

    expect(() => score.moveTrack(foreignTrack, 0)).toThrow(Error);
    expect(() => score.moveTrack(score.tracks[0], -1)).toThrow(Error);
  });

  test("removeMasterBar throws when removing the last remaining master bar", () => {
    const score = new Score();
    const masterBar = score.masterBars[0];
    const staff = score.tracks[0].staves[0];
    const bar = staff.bars[0];

    expect(() => score.removeMasterBar(0)).toThrow(Error);
    expect(score.masterBars).toEqual([masterBar]);
    expect(staff.bars).toEqual([bar]);
  });

  test("appendMasterBar adds corresponding bars for every track staff", () => {
    const score = new Score();
    const firstTrack = score.tracks[0];
    firstTrack.insertStaff(1);
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const staves = [...firstTrack.staves, ...secondTrack.staves];
    const firstBars = staves.map((s) => s.bars[0]);
    const firstMasterBar = score.masterBars[0];

    const output = score.appendMasterBar(DEFAULT_MASTER_BAR);

    expect(output.index).toBe(1);
    expect(output.bars.size).toBe(3);
    expect(score.masterBars).toEqual([firstMasterBar, output.masterBar]);
    for (const [i, staff] of staves.entries()) {
      expect(staff.bars).toHaveLength(2);
      expect(staff.bars[0]).toBe(firstBars[i]);
      expect(staff.bars[1].masterBar).toBe(output.masterBar);
      expect(output.bars.get(staff.uuid)).toBe(staff.bars[1]);
    }
  });

  test("removeMasterBar removes aligned bars from every track staff", () => {
    const score = new Score();
    score.tracks[0].insertStaff(1);
    score.addTrack(new Guitar(), "Track 2");
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const [first, middle, last] = score.masterBars;
    const staves = score.tracks.flatMap((t) => t.staves);
    const originalBars = staves.map((s) => [...s.bars]);

    const removed = score.removeMasterBar(1);

    expect(score.masterBars).toEqual([first, last]);
    expect(removed.index).toBe(1);
    expect(removed.masterBar).toBe(middle);
    expect(removed.bars.size).toBe(3);
    for (const [i, staff] of staves.entries()) {
      expect(staff.bars).toHaveLength(2);
      expect(staff.bars[0]).toBe(originalBars[i][0]);
      expect(staff.bars[1]).toBe(originalBars[i][2]);
      expect(removed.bars.get(staff.uuid)).toBe(originalBars[i][1]);
    }
  });

  test("addTrack in a multi-bar score creates staff bars aligned to master bars", () => {
    const score = new Score();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const output = score.addTrack(new Guitar(), "Late Track");
    const addedTrack = output.tracks[0];
    const [first, second, third] = addedTrack.staves[0].bars;

    expect(score.masterBars).toHaveLength(3);
    expect(addedTrack.staves).toHaveLength(1);
    expect(addedTrack.staves[0].bars).toHaveLength(3);
    expect(first.masterBar).toBe(score.masterBars[0]);
    expect(second.masterBar).toBe(score.masterBars[1]);
    expect(third.masterBar).toBe(score.masterBars[2]);
  });

  test("validates matched and unmatched repeat boundaries", () => {
    const score = new Score();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    score.masterBars[2].isRepeatStart = true;

    expect(score.isMasterBarRepeatStatusValid(score.masterBars[0])).toBe(true);
    expect(score.isMasterBarRepeatStatusValid(score.masterBars[1])).toBe(true);
    expect(score.isMasterBarRepeatStatusValid(score.masterBars[2])).toBe(false);
  });

  test("accepts separate repeat sections and an ordinary bar", () => {
    const score = new Score();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[0].isRepeatEnd = true;
    score.masterBars[1].isRepeatStart = true;
    score.masterBars[2].isRepeatEnd = true;
    score.masterBars[3].isRepeatStart = true;
    score.masterBars[4].isRepeatEnd = true;

    for (const masterBar of score.masterBars) {
      expect(score.isMasterBarRepeatStatusValid(masterBar)).toBe(true);
    }
  });

  test("supersedes an unmatched repeat start with a later start", () => {
    const score = new Score();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatStart = true;
    score.masterBars[2].isRepeatEnd = true;

    expect(score.isMasterBarRepeatStatusValid(score.masterBars[0])).toBe(false);
    expect(score.isMasterBarRepeatStatusValid(score.masterBars[1])).toBe(true);
    expect(score.isMasterBarRepeatStatusValid(score.masterBars[2])).toBe(true);
  });

  test("matches repeat boundaries on the same master bar", () => {
    const score = new Score();
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[0].isRepeatEnd = true;

    expect(score.isMasterBarRepeatStatusValid(score.masterBars[0])).toBe(true);
  });
});
