import { DEFAULT_MASTER_BAR } from "../../src/notation/model";
import { createScoreGraph } from "./helpers";

describe("Staff model", () => {
  test("showClassicNotation setter updates the correct property", () => {
    const { staff } = createScoreGraph();

    staff.showClassicNotation = true;

    expect(staff.showClassicNotation).toBe(true);
    expect(staff.showTablature).toBe(true);
  });

  test("removeBar rejects invalid indices", () => {
    const { staff } = createScoreGraph();

    expect(() => staff.removeBar(-1)).toThrow(Error);
    expect(() => staff.removeBar(staff.bars.length)).toThrow(Error);
  });

  test("removeBar throws when removing the last remaining bar", () => {
    const { staff } = createScoreGraph();

    expect(() => staff.removeBar(0)).toThrow(
      "Staff must have at least one bar"
    );
  });

  test("getNextBeat and getPrevBeat traverse across bar boundaries", () => {
    const { score, bar, staff } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    bar.appendBeats();

    const firstBarLastBeat = bar.beats[1];
    const secondBarFirstBeat = staff.bars[1].beats[0];

    expect(staff.getNextBeat(firstBarLastBeat)).toBe(secondBarFirstBeat);
    expect(staff.getPrevBeat(secondBarFirstBeat)).toBe(firstBarLastBeat);
  });

  test("getBeatsSeq returns flattened beat sequence in bar order", () => {
    const { score, staff, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    bar.appendBeats();

    const beatsSeq = staff.getBeatsSeq();

    expect(beatsSeq).toHaveLength(3);
    expect(beatsSeq[0]).toBe(staff.bars[0].beats[0]);
    expect(beatsSeq[1]).toBe(staff.bars[0].beats[1]);
    expect(beatsSeq[2]).toBe(staff.bars[1].beats[0]);
  });
});
