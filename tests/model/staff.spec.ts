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
});
