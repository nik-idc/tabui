/**
 * @jest-environment jsdom
 */
import {
  exportMusicXml,
  importMusicXml,
  MusicXmlImportError,
  SerializedBeat,
  SerializedScoreV1,
  serializeScore,
} from "../../../src/notation/format";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createFeatureShowcaseScoreFixture } from "../../../fixtures/feature-showcase-score";

/**
 * Removes what MusicXML cannot store: the master volume, stroke timing, and
 * empty Let Ring slots (beats with no played note come back as rests).
 */
function normalize(document: SerializedScoreV1): SerializedScoreV1 {
  const copy = JSON.parse(JSON.stringify(document)) as SerializedScoreV1;
  copy.masterVolume = 0;
  for (const track of copy.tracks) {
    for (const staff of track.staves) {
      for (const bar of staff.bars) {
        for (const voice of bar.voices) {
          for (const beat of voice?.beats ?? []) {
            if (beat.notes?.every((v) => v === null || v.fret === null)) {
              beat.notes = null;
            }
            for (const technique of beat.techniques ?? []) {
              technique.options.duration = 0;
              technique.options.alignment = 0;
            }
          }
        }
      }
    }
  }
  return copy;
}

/** Wraps measures of one part in a MusicXML document. */
function musicXml(parts: { name: string; measures: string }[]): string {
  const partList = parts
    .map(
      (part, index) =>
        `<score-part id="P${index + 1}"><part-name>${part.name}</part-name></score-part>`
    )
    .join("");
  const body = parts
    .map((part, index) => `<part id="P${index + 1}">${part.measures}</part>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Test song</work-title></work>
  <identification><creator type="composer">Someone</creator></identification>
  <part-list>${partList}</part-list>
  ${body}
</score-partwise>`;
}

const TAB_ATTRIBUTES = `
  <attributes>
    <divisions>2</divisions>
    <time><beats>4</beats><beat-type>4</beat-type></time>
    <clef><sign>TAB</sign><line>5</line></clef>
    <staff-details>
      <staff-lines>6</staff-lines>
      <staff-tuning line="1"><tuning-step>E</tuning-step><tuning-octave>2</tuning-octave></staff-tuning>
      <staff-tuning line="2"><tuning-step>A</tuning-step><tuning-octave>2</tuning-octave></staff-tuning>
      <staff-tuning line="3"><tuning-step>D</tuning-step><tuning-octave>3</tuning-octave></staff-tuning>
      <staff-tuning line="4"><tuning-step>G</tuning-step><tuning-octave>3</tuning-octave></staff-tuning>
      <staff-tuning line="5"><tuning-step>B</tuning-step><tuning-octave>3</tuning-octave></staff-tuning>
      <staff-tuning line="6"><tuning-step>E</tuning-step><tuning-octave>4</tuning-octave></staff-tuning>
    </staff-details>
  </attributes>`;

function tabNote(
  string: number,
  fret: number,
  extra = "",
  options: { chord?: boolean; staff?: number } = {}
): string {
  return `<note>
    ${options.chord === true ? "<chord/>" : ""}
    <pitch><step>C</step><octave>4</octave></pitch>
    <duration>2</duration><voice>1</voice><type>quarter</type>
    ${options.staff === undefined ? "" : `<staff>${options.staff}</staff>`}
    <notations><technical><string>${string}</string><fret>${fret}</fret></technical>${extra}</notations>
  </note>`;
}

describe("MusicXML round trip", () => {
  test("keeps the feature showcase except for what MusicXML cannot store", () => {
    const score = createFeatureShowcaseScoreFixture();

    const result = importMusicXml(exportMusicXml(score));

    expect(result.warnings).toEqual([]);
    expect(normalize(serializeScore(result.score))).toEqual(
      normalize(serializeScore(score))
    );
  });
});

describe("exportMusicXml", () => {
  test("writes a tab staff with its tuning, strings, and frets", () => {
    const xml = exportMusicXml(createFeatureShowcaseScoreFixture());

    expect(xml).toContain(
      '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN"'
    );
    expect(xml).toContain("<sign>TAB</sign>");
    expect(xml).toContain('<staff-tuning line="1">');
    expect(xml).toMatch(/<string>\d+<\/string>\s*<fret>\d+<\/fret>/);
    expect(xml).toContain("<work-title>Sample song</work-title>");
  });

  test("writes volumes so other apps play them at the same loudness", () => {
    const xml = exportMusicXml(createFeatureShowcaseScoreFixture());

    // The showcase has tracks at 0.5 (-6 dB) and 1 (0 dB).
    const volumes = Array.from(
      xml.matchAll(/<volume>([\d.]+)<\/volume>/g),
      (v) => Number(v[1])
    );
    expect(volumes).toEqual([70.71, 70.71, 70.71, 100, 100]);
  });
});

describe("importMusicXml", () => {
  test("reads notes, chords, and the score details", () => {
    const xml = musicXml([
      {
        name: "Lead",
        measures: `<measure number="1">${TAB_ATTRIBUTES}
          ${tabNote(6, 3)}${tabNote(5, 5, "", { chord: true })}
          ${tabNote(3, 0)}
          <note><rest/><duration>4</duration><voice>1</voice><type>half</type></note>
        </measure>`,
      },
    ]);

    const { score, warnings } = importMusicXml(xml);
    const document = serializeScore(score);

    expect(warnings).toEqual([]);
    expect(document.name).toBe("Test song");
    expect(document.artist).toBe("Someone");
    expect(document.tracks[0].name).toBe("Lead");
    const beats = document.tracks[0].staves[0].bars[0].voices[0]?.beats;
    expect(beats?.map((v) => v.duration)).toEqual([
      "quarter",
      "quarter",
      "half",
    ]);
    expect(beats?.[0].notes?.[5]?.fret).toBe(3);
    expect(beats?.[0].notes?.[4]?.fret).toBe(5);
    expect(beats?.[1].notes?.[2]?.fret).toBe(0);
    expect(beats?.[2].notes).toBeNull();
  });

  test("keeps only the tab staff of a part with standard and tab staves", () => {
    const attributes = TAB_ATTRIBUTES.replace(
      "<clef>",
      '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2">'
    ).replace("<staff-details>", '<staff-details number="2">');
    const xml = musicXml([
      {
        name: "Guitar",
        measures: `<measure number="1">${attributes}
          <note><pitch><step>G</step><octave>2</octave></pitch><duration>8</duration><voice>1</voice><type>whole</type><staff>1</staff></note>
          <backup><duration>8</duration></backup>
          ${tabNote(6, 3, "", { staff: 2 }).replace("<voice>1</voice>", "<voice>5</voice>")}
        </measure>`,
      },
    ]);

    const document = serializeScore(importMusicXml(xml).score);

    expect(document.tracks[0].staves).toHaveLength(1);
    const beats = document.tracks[0].staves[0].bars[0].voices[0]?.beats;
    expect(beats?.[0].notes?.[5]?.fret).toBe(3);
  });

  test("skips parts without a tab staff", () => {
    const xml = musicXml([
      {
        name: "Piano",
        measures: `<measure number="1"><attributes><divisions>1</divisions><clef><sign>G</sign><line>2</line></clef></attributes>
          <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type></note>
        </measure>`,
      },
      {
        name: "Lead",
        measures: `<measure number="1">${TAB_ATTRIBUTES}${tabNote(1, 12)}</measure>`,
      },
    ]);

    const { score, warnings } = importMusicXml(xml);

    expect(score.tracks).toHaveLength(1);
    expect(warnings).toEqual(['Skipped "Piano": it has no tab staff.']);
  });

  test("keeps repeats without a partner as they are", () => {
    const rest = `<note><rest/><duration>8</duration><voice>1</voice><type>whole</type></note>`;
    const xml = musicXml([
      {
        name: "Lead",
        measures: `
          <measure number="1">${TAB_ATTRIBUTES}${rest}<barline location="right"><repeat direction="backward"/></barline></measure>
          <measure number="2"><barline location="left"><repeat direction="forward"/></barline>${rest}</measure>`,
      },
    ]);

    const bars = importMusicXml(xml).score.masterBars;

    expect([bars[0].isRepeatStart, bars[0].isRepeatEnd]).toEqual([false, true]);
    expect(bars[0].repeatCount).toBe(2);
    expect([bars[1].isRepeatStart, bars[1].isRepeatEnd]).toEqual([true, false]);
  });

  test("adds techniques and skips the ones TabUI rejects", () => {
    const xml = musicXml([
      {
        name: "Lead",
        measures: `<measure number="1">${TAB_ATTRIBUTES}
          ${tabNote(3, 5, '<technical><hammer-on type="start">H</hammer-on></technical>')}
          ${tabNote(3, 7, "<articulations><strong-accent/></articulations>")}
          ${tabNote(3, 0, '<slide type="start"/>')}
          ${tabNote(3, 7, "<technical><bend><bend-alter>2</bend-alter></bend></technical>")}
        </measure>`,
      },
    ]);

    const { score, warnings } = importMusicXml(xml);
    const beats =
      serializeScore(score).tracks[0].staves[0].bars[0].voices[0]?.beats;

    expect(beats?.[0].notes?.[2]?.techniques).toEqual([
      { type: "hammer-on-or-pull-off" },
    ]);
    expect(beats?.[1].notes?.[2]?.techniques).toEqual([
      { type: "accent", options: { kind: "heavy" } },
    ]);
    // A slide cannot start on an open string.
    expect(beats?.[2].notes?.[2]?.techniques).toEqual([]);
    expect(beats?.[3].notes?.[2]?.techniques).toEqual([
      {
        type: "bend",
        options: { type: "bend", bendPitch: 1, bendDuration: 1 },
      },
    ]);
    expect(warnings).toEqual(["Skipped 1 techniques that TabUI cannot place."]);
  });

  test("throws for files it cannot import", () => {
    expect(() => importMusicXml("not xml")).toThrow(MusicXmlImportError);
    expect(() =>
      importMusicXml('<score-timewise version="4.0"></score-timewise>')
    ).toThrow("Timewise MusicXML files are not supported");
    expect(() =>
      importMusicXml(
        musicXml([
          {
            name: "Piano",
            measures: `<measure number="1"><note><rest/><duration>4</duration><voice>1</voice></note></measure>`,
          },
        ])
      )
    ).toThrow("The file has no part with a tab staff");
  });
});

/**
 * A score made in Guitar Pro 7.5 and exported as MusicXML 2.0, with one
 * feature per bar. The expected values come from the Guitar Pro file itself.
 */
describe("importMusicXml with a Guitar Pro 7 file", () => {
  const xml = readFileSync(
    path.join(__dirname, "../../../fixtures/guitar-pro-7.musicxml"),
    "utf8"
  );
  const { score, warnings } = importMusicXml(xml);
  const document = serializeScore(score);
  const [guitar, bass] = document.tracks;

  /** Returns a voice's beats in a bar (bar and voice from 1). */
  const beats = (bar: number, voice = 1, track = guitar): SerializedBeat[] =>
    track.staves[0].bars[bar - 1].voices[voice - 1]?.beats ?? [];
  /** Returns "string:fret" for each note of a beat, string 1 first. */
  const frets = (beat: SerializedBeat): string[] =>
    (beat.notes ?? []).flatMap((v, i) =>
      v === null ? [] : [`${i + 1}:${v.fret}`]
    );
  /** Returns the technique types of a note (string from 1). */
  const techniques = (beat: SerializedBeat, string: number) =>
    beat.notes?.[string - 1]?.techniques.map((v) =>
      "options" in v ? { type: v.type, options: v.options } : v.type
    );

  test("imports without warnings", () => {
    expect(warnings).toEqual([]);
  });

  test("reads the tracks, tunings, and instruments", () => {
    expect(document.name).toBe("");
    expect(document.artist).toBe("");
    expect(document.tracks.map((v) => [v.name, v.instrument.tone])).toEqual([
      ["Clean Guitar", "Electric Clean"],
      ["Acoustic Bass", "Bass Acoustic"],
    ]);
    const tunings = document.tracks.map((v) =>
      v.instrument.tuning.map((n) => `${n.noteValue}${n.octave}`)
    );
    expect(tunings).toEqual([
      ["E4", "B3", "G3", "D3", "A2", "E2"],
      ["G2", "D2", "A1", "E1"],
    ]);
    // MIDI volume 80% is about -3.9 dB, the same as a track volume of 0.64.
    expect(document.tracks.map((v) => v.volume)).toEqual([0.64, 0.64]);
    expect(document.tracks.map((v) => v.staves.length)).toEqual([1, 1]);
  });

  test("reads time signatures, tempo, and repeats", () => {
    const bars = document.masterBars;
    expect(bars).toHaveLength(16);
    expect(bars.map((v) => v.beatsCount)).toEqual([
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3,
    ]);
    expect(bars.map((v) => v.tempo)).toEqual([
      120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 140,
      140,
    ]);
    expect(bars[14].isRepeatStart).toBe(true);
    expect([bars[15].isRepeatEnd, bars[15].repeatCount]).toEqual([true, 3]);
  });

  test("reads rhythms, chords, rests, and dead notes", () => {
    expect(beats(1).map((v) => [v.duration, v.tuplet])).toEqual([
      ["half", { normalCount: 3, tupletCount: 2 }],
      ["half", { normalCount: 3, tupletCount: 2 }],
      ["half", { normalCount: 3, tupletCount: 2 }],
    ]);
    expect(frets(beats(2)[0])).toEqual(["1:-1"]);
    expect(beats(2)[1].notes).toBeNull();
    expect(frets(beats(3)[0])).toEqual(["3:2", "4:3", "5:1", "6:1"]);
    expect(
      beats(3).map((v) => [v.duration, v.dots, v.tuplet?.normalCount])
    ).toEqual([
      ["quarter", 1, undefined],
      ["quarter", 1, undefined],
      ["eighth", 0, 3],
      ["eighth", 0, 3],
      ["eighth", 0, 3],
    ]);
    expect(frets(beats(16)[0])).toEqual(["2:4", "3:4", "4:2"]);
  });

  test("reads tap, accents, ties, legato, and slides", () => {
    expect(beats(1).map((v) => techniques(v, 1))).toEqual([
      ["tap"],
      [{ type: "accent", options: { kind: "normal" } }],
      [{ type: "accent", options: { kind: "heavy" } }],
    ]);
    expect([...beats(4), ...beats(5)].map((v) => techniques(v, 3))).toEqual([
      [],
      ["tie"],
      ["tie"],
    ]);
    expect(beats(6).map((v) => techniques(v, 3))).toEqual([
      ["hammer-on-or-pull-off"],
      ["hammer-on-or-pull-off"],
      ["hammer-on-or-pull-off"],
      [],
    ]);
    expect(beats(7).map((v) => techniques(v, 3))).toEqual([
      ["slide"],
      [],
      ["slide"],
      [],
    ]);
  });

  test("reads bends, including a held and released tied bend", () => {
    const bend = (options: object) => [{ type: "bend", options }];
    expect(beats(8).map((v) => techniques(v, 3))).toEqual([
      bend({ type: "bend", bendPitch: 1, bendDuration: 1 }),
      bend({
        type: "bend-and-release",
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 1,
      }),
    ]);
    expect(beats(9).map((v) => techniques(v, 3))).toEqual([
      bend({ type: "bend", bendPitch: 1, bendDuration: 1 }),
      ["tie", ...bend({ type: "hold", holdPitch: 1, bendDuration: 1 })],
      ["tie", ...bend({ type: "release", releasePitch: 0, bendDuration: 1 })],
    ]);
  });

  test("reads palm mutes and harmonics", () => {
    for (const beat of beats(10)) {
      expect([techniques(beat, 5), techniques(beat, 6)]).toEqual([
        ["palm-mute"],
        ["palm-mute"],
      ]);
    }
    expect(beats(11).map((v) => techniques(v, 3))).toEqual([
      ["natural-harmonic"],
      ["pinch-harmonic"],
    ]);
  });

  test("reads dynamics for every voice of the staff", () => {
    expect(beats(12).map((v) => v.dynamic)).toEqual(["ppp", "p", "f", "fff"]);
    // The second voice has no marks of its own and keeps the last one.
    expect(beats(13, 2).map((v) => [frets(v), v.dynamic])).toEqual([
      [["6:1"], "fff"],
      [["6:2"], "fff"],
      [["6:3"], "fff"],
      [["6:4"], "fff"],
    ]);
    const bassDynamics = bass.staves[0].bars.flatMap((v) =>
      (v.voices[0]?.beats ?? []).map((b) => b.dynamic)
    );
    expect(new Set(bassDynamics)).toEqual(new Set(["fff"]));
  });

  test("gets no let ring, vibrato, or stroke, which Guitar Pro does not export", () => {
    // Bar 14 has let ring on strings 3, 4, and 5, one note per beat.
    const letRing = beats(14);
    expect([
      techniques(letRing[0], 3),
      techniques(letRing[1], 4),
      techniques(letRing[2], 5),
    ]).toEqual([[], [], []]);
    expect(techniques(beats(15)[0], 3)).toEqual([]);
    expect(beats(16)[0].techniques).toBeUndefined();
  });

  test("exports and imports again without changes", () => {
    const again = importMusicXml(exportMusicXml(score));

    expect(again.warnings).toEqual([]);
    expect(serializeScore(again.score)).toEqual(document);
  });
});
