import { TabWindowDim } from "../../src";

const width = 1200;
const noteTextSize = 12;
const timeSigTextSize = 24;
const tempoTextSize = 36;
const durationsHeight = 50;
const stringsCount = 6;

describe("Tab window dim tests", () => {
  test("Tab window dim test", () => {
    const twd = new TabWindowDim(
      width,
      noteTextSize,
      timeSigTextSize,
      tempoTextSize,
      durationsHeight,
      stringsCount
    );

    const expected = {
      noteRectHeight: noteTextSize * 2,
      noteRectWidthThirtySecond: noteTextSize * 3,
      noteRectWidthSixteenth: noteTextSize * 3 * 1.1,
      noteRectWidthEighth: noteTextSize * 3 * 1.2,
      noteRectWidthQuarter: noteTextSize * 3 * 1.3,
      noteRectWidthHalf: noteTextSize * 3 * 1.4,
      noteRectWidthWhole: noteTextSize * 3 * 1.5,
      timeSigRectWidth: noteTextSize * 3,
      timeSigRectHeight: noteTextSize * 2 * (stringsCount - 1),
      tempoRectWidth: durationsHeight + 5 * tempoTextSize,
      tempoRectHeight: durationsHeight,
      tabLineHeight:
        durationsHeight + noteTextSize * 2 * stringsCount + durationsHeight,
    };

    const actual = {
      noteRectHeight: twd.noteRectHeight,
      noteRectWidthThirtySecond: twd.noteRectWidthThirtySecond,
      noteRectWidthSixteenth: twd.noteRectWidthSixteenth,
      noteRectWidthEighth: twd.noteRectWidthEighth,
      noteRectWidthQuarter: twd.noteRectWidthQuarter,
      noteRectWidthHalf: twd.noteRectWidthHalf,
      noteRectWidthWhole: twd.noteRectWidthWhole,
      timeSigRectWidth: twd.timeSigRectWidth,
      timeSigRectHeight: twd.timeSigRectHeight,
      tempoRectWidth: twd.tempoRectWidth,
      tempoRectHeight: twd.tempoRectHeight,
      tabLineHeight: twd.tabLineHeight,
    };

    expect(actual).toStrictEqual(expected);
  });
});
