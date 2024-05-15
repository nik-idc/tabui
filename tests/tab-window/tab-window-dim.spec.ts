import { TabWindowDim } from "../../src";

const width = 1200;
const minNoteSize = 12;
const gap = 5;
const durationsHeight = 50;
const strCount = 6;

describe("Tab window dim tests", () => {
  test("Tab window dim test", () => {
    const twd = new TabWindowDim(
      width,
      minNoteSize,
      gap,
      durationsHeight,
      strCount
    );

    const expected = {
    minInfoWidth: minNoteSize * 2,
      barHeight: strCount * minNoteSize,
      tabLineHeight: strCount * minNoteSize + durationsHeight,
      lineHeight: durationsHeight + strCount * minNoteSize,
    };

    const actual = {
      minInfoWidth: twd.minInfoWidth,
      barHeight: twd.barHeight,
      tabLineHeight: twd.tabLineHeight,
      lineHeight: twd.lineHeight,
    };

    expect(actual).toStrictEqual(expected);
  });
});
