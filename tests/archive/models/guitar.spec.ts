import { TabWindow } from "../../src/index";
import { Guitar } from "../../src/index";

describe("Guitar Model Tests", () => {
  test("Guitar from valid object test", () => {
    const guitarObj = {
      stringsCount: 7,
      tuning: ["G", "C", "G", "C", "F", "A", "D"],
      fretsCount: 24,
    };

    let parseError: Error | undefined;
    try {
      const guitar = Guitar.fromObject(guitarObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
    }
  });
  test("Guitar from invalid object test", () => {
    const guitarObj = {
      stringsCnt: 7,
      tuning: undefined,
      fretsCount: "aaaa",
    };

    let parseError: Error | undefined;
    try {
      const guitar = Guitar.fromObject(guitarObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
    }
  });
});
