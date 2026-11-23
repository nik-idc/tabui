import { Score } from "../../../src/notation/model";

describe("VoiceBar", () => {
  test.each([-1, 0.5, 2])(
    "insertBeats rejects invalid index %s even for empty input",
    (index) => {
      const score = new Score();
      const staff = score.tracks[0].staves[0];
      const voice = staff.bars[0].ensureVoiceBar(1);
      const beats = [...voice.beats];
      const actualTicks = voice.actualTicks;

      expect(() => voice.insertBeats(index, [])).toThrow("invalid beat index");

      expect(voice.beats).toEqual(beats);
      expect(voice.actualTicks).toBe(actualTicks);
      expect(staff.nonEmptyVoiceNumbers).toEqual([1]);
    }
  );
});
