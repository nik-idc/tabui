import { Guitar, Score, Track } from "../../src/notation/model";

describe("Track model", () => {
  test("new Track creates one default staff", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");

    expect(track.staves).toHaveLength(1);
    expect(track.staves[0].track).toBe(track);
    expect(track.staves[0].bars).toHaveLength(1);
  });

  test("Score.addTrack creates a track with one default staff", () => {
    const score = new Score();

    const result = score.addTrack(new Guitar(), "Guitar");

    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].staves).toHaveLength(1);
    expect(result.tracks[0].staves[0].bars).toHaveLength(
      score.masterBars.length
    );
  });

  test("removeStaff rejects index equal to current length", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");

    expect(() => track.removeStaff(track.staves.length)).toThrow(Error);
  });

  test("removeStaff keeps one default staff when removing the last staff", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");

    const outputs = track.removeStaff(0);

    expect(outputs).toHaveLength(2);
    expect(track.staves).toHaveLength(1);
    expect(track.staves[0].track).toBe(track);
    expect(track.staves[0].bars).toHaveLength(track.score.masterBars.length);
  });

  test("insertStaff aligns bars with master bars", () => {
    const score = new Score();
    score.appendMasterBar();
    const track = new Track(score, new Guitar(), "Guitar");

    const result = track.insertStaff(track.staves.length);

    expect(result.staves).toHaveLength(1);
    expect(result.staves[0].bars).toHaveLength(score.masterBars.length);
  });
});
