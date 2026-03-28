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
      noteRectWidth32: noteTextSize * 3,
      noteRectWidth16: noteTextSize * 3 * 1.1,
      noteRectWidth8: noteTextSize * 3 * 1.2,
      noteRectWidth4: noteTextSize * 3 * 1.3,
      noteRectWidth2: noteTextSize * 3 * 1.4,
      noteRectWidth1: noteTextSize * 3 * 1.5,
      timeSigRectWidth: noteTextSize * 3,
      timeSigRectHeight: noteTextSize * 2 * (stringsCount - 1),
      tempoRectWidth: durationsHeight + 5 * tempoTextSize,
      tempoRectHeight: durationsHeight,
      tabLineMinHeight:
        durationsHeight + noteTextSize * 2 * stringsCount + durationsHeight,
    };

    const actual = {
      noteRectHeight: twd.noteRectHeight,
      noteRectWidth32: twd.noteRectWidth32,
      noteRectWidth16: twd.noteRectWidth16,
      noteRectWidth8: twd.noteRectWidth8,
      noteRectWidth4: twd.noteRectWidth4,
      noteRectWidth2: twd.noteRectWidth2,
      noteRectWidth1: twd.noteRectWidth1,
      timeSigRectWidth: twd.timeSigRectWidth,
      timeSigRectHeight: twd.timeSigRectHeight,
      tempoRectWidth: twd.tempoRectWidth,
      tempoRectHeight: twd.tempoRectHeight,
      tabLineMinHeight: twd.tabLineMinHeight,
    };

    expect(actual).toStrictEqual(expected);
  });
});
