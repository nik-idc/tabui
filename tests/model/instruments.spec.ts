import {
  DEFAULT_BASS_GUITARS,
  DEFAULT_OTHER_STRING,
  Guitar,
} from "../../src/notation/model";
import {
  BassGuitarPreset,
  OtherStringPreset,
} from "../../src/notation/model/instrument/instrument-preset";

describe("Default instruments", () => {
  test("ukulele default uses four strings and matching tuning", () => {
    const ukulele = DEFAULT_OTHER_STRING[OtherStringPreset.Ukulele];

    expect(ukulele).toBeInstanceOf(Guitar);
    expect((ukulele as Guitar).stringsCount).toBe(4);
    expect((ukulele as Guitar).tuning).toHaveLength(4);
  });

  test("default bass uses tuning length matching string count", () => {
    const bass = DEFAULT_BASS_GUITARS[BassGuitarPreset.Clean] as Guitar;

    expect(bass.tuning).toHaveLength(bass.stringsCount);
  });
});
