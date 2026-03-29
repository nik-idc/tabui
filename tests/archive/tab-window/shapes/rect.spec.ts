import { Point, Rect } from "../../../src";

describe("Rectangle tests", () => {
  test("Rectangle corner points test", () => {
    const rect = new Rect(10, 15, 20, 35);

    expect(rect.leftTop).toStrictEqual(new Point(10, 15));
    expect(rect.rightTop).toStrictEqual(new Point(30, 15));
    expect(rect.rightBottom).toStrictEqual(new Point(30, 50));
    expect(rect.leftBottom).toStrictEqual(new Point(10, 50));
  });
});
