import {
  DEFAULT_MASTER_BAR,
  Dynamic,
  DynamicDirection,
  NoteDuration,
  ScoreEditor,
} from "../../../src/notation/model";
import { createBarWithBeats } from "./helpers";
import { required } from "../required";

/** Builds two bars whose voice 1 ends with the given dynamics. */
function twoBars(first: Dynamic, last: Dynamic) {
  const graph = createBarWithBeats([
    { baseDuration: NoteDuration.Half },
    { baseDuration: NoteDuration.Half },
  ]);
  graph.beats[0].dynamic = first;
  graph.beats[1].dynamic = last;
  ScoreEditor.appendMasterBar(graph.score, undefined, 1);
  const secondVoice = required(graph.staff.bars[1].getVoiceBar(1));
  return { ...graph, secondVoice };
}

describe("beat dynamic", () => {
  test("a new beat is mf, and copies keep their own dynamic", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    expect(beats[0].dynamic).toBe(Dynamic.MezzoForte);

    beats[0].dynamic = Dynamic.Pianissimo;
    beats[0].makeRest();

    // A rest keeps its dynamic, and both kinds of copy take it.
    const copy = beats[0].deepCopy();
    expect(copy.dynamic).toBe(Dynamic.Pianissimo);
    const voiceCopy = beats[0].voiceBar.deepCopy();
    expect(voiceCopy.beats[0].dynamic).toBe(Dynamic.Pianissimo);
  });

  test("restoring saved content restores the dynamic", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Forte;
    const saved = beats[0].deepCopy();
    beats[0].dynamic = Dynamic.Piano;

    beats[0].restoreContent(saved);

    expect(beats[0].dynamic).toBe(Dynamic.Forte);
  });

  test("a dynamic difference makes two beats unequal", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const copy = beats[0].deepCopy();
    expect(beats[0].compare(copy)).toBe(true);

    copy.dynamic = Dynamic.Forte;

    expect(beats[0].compare(copy)).toBe(false);
  });
});

describe("dynamic inheritance", () => {
  test("an inserted or appended beat takes the dynamic of the beat before it", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Piano;
    beats[1].dynamic = Dynamic.Fortissimo;

    const inserted = ScoreEditor.insertBeat(beats[0].voiceBar, 1).beats[0];
    const appended = ScoreEditor.appendBeat(beats[0].voiceBar).beats[0];

    expect(inserted.dynamic).toBe(Dynamic.Piano);
    expect(appended.dynamic).toBe(Dynamic.Fortissimo);
  });

  test("a rest passes its dynamic on to the next new beat", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Pianississimo;
    ScoreEditor.setRest(beats, true);

    const appended = ScoreEditor.appendBeat(beats[0].voiceBar).beats[0];

    expect(appended.dynamic).toBe(Dynamic.Pianississimo);
  });

  test("a beat at the start of a bar takes the last dynamic of the previous bar", () => {
    const { beats, secondVoice } = twoBars(Dynamic.Piano, Dynamic.Forte);

    // The new bar's own rest, and a beat inserted before it, both inherit.
    expect(secondVoice.beats[0].dynamic).toBe(Dynamic.Forte);
    const inserted = ScoreEditor.insertBeat(secondVoice, 0).beats[0];
    expect(inserted.dynamic).toBe(Dynamic.Forte);
    expect(beats[0].dynamic).toBe(Dynamic.Piano);
  });

  test("a bar inserted in the middle inherits from the bar before it", () => {
    const { score, staff } = twoBars(Dynamic.Piano, Dynamic.Fortissimo);
    required(staff.bars[1].getVoiceBar(1)).beats[0].dynamic =
      Dynamic.Pianissimo;

    ScoreEditor.insertMasterBar(score, 1, DEFAULT_MASTER_BAR, 1);

    expect(staff.bars[1].getVoiceBar(1)?.beats[0].dynamic).toBe(
      Dynamic.Fortissimo
    );
  });

  test("the search goes past bars where the voice is absent", () => {
    const { staff, secondVoice } = twoBars(Dynamic.Piano, Dynamic.Piano);
    staff.bars[0].ensureVoiceBar(2).beats[0].dynamic = Dynamic.Forte;
    expect(staff.bars[1].getVoiceBar(2)).toBeNull();
    ScoreEditor.appendMasterBar(staff.track.score, undefined, 1);

    const thirdBarVoice2 = staff.bars[2].ensureVoiceBar(2);

    expect(thirdBarVoice2.beats[0].dynamic).toBe(Dynamic.Forte);
    // Other voices are not used.
    expect(secondVoice.beats[0].dynamic).toBe(Dynamic.Piano);
  });

  test("a fallback rest after removing all beats inherits across the bar line", () => {
    const { secondVoice } = twoBars(Dynamic.Piano, Dynamic.MezzoPiano);
    secondVoice.beats[0].dynamic = Dynamic.Fortississimo;

    ScoreEditor.removeBeats([...secondVoice.beats]);

    expect(secondVoice.beats).toHaveLength(1);
    expect(secondVoice.beats[0].dynamic).toBe(Dynamic.MezzoPiano);
  });

  test("a beat with nothing before it gets mf", () => {
    const { score, staff } = twoBars(Dynamic.Piano, Dynamic.Piano);

    ScoreEditor.prependMasterBar(score, undefined, 1);

    expect(staff.bars[0].getVoiceBar(1)?.beats[0].dynamic).toBe(
      Dynamic.MezzoForte
    );
  });
});

describe("ScoreEditor dynamic edits", () => {
  test("setDynamic sets one dynamic on note beats and rests", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[1].makeRest();
    expect(ScoreEditor.allBeatsHaveDynamic(beats, Dynamic.Piano)).toBe(false);

    expect(ScoreEditor.setDynamic(beats, Dynamic.Piano)).toBe(true);
    expect(beats.map((b) => b.dynamic)).toEqual([Dynamic.Piano, Dynamic.Piano]);
    expect(ScoreEditor.allBeatsHaveDynamic(beats, Dynamic.Piano)).toBe(true);
  });

  test("shiftDynamics moves each beat one level from its own dynamic and stops at ppp and fff", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Pianississimo;
    beats[1].dynamic = Dynamic.MezzoPiano;
    beats[2].dynamic = Dynamic.Fortississimo;

    ScoreEditor.shiftDynamics(beats, DynamicDirection.Louder);
    expect(beats.map((b) => b.dynamic)).toEqual([
      Dynamic.Pianissimo,
      Dynamic.MezzoForte,
      Dynamic.Fortississimo,
    ]);

    beats[0].dynamic = Dynamic.Pianississimo;
    ScoreEditor.shiftDynamics(beats, DynamicDirection.Softer);
    expect(beats.map((b) => b.dynamic)).toEqual([
      Dynamic.Pianississimo,
      Dynamic.MezzoPiano,
      Dynamic.Fortissimo,
    ]);
  });

  test("a shift at the limit changes nothing", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Fortississimo;

    expect(ScoreEditor.canShiftDynamics(beats, DynamicDirection.Louder)).toBe(
      false
    );
    expect(ScoreEditor.shiftDynamics(beats, DynamicDirection.Louder)).toBe(
      false
    );
  });
});
