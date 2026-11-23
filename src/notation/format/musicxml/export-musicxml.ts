import { Score } from "../../model/score";
import { serializeScore } from "../tabui/v1/serialize-score";
import {
  SerializedBeat,
  SerializedBendOptions,
  SerializedBendType,
  SerializedDynamic,
  SerializedGuitarNote,
  SerializedMasterBar,
  SerializedScoreV1,
  SerializedStrokeDirection,
  SerializedTechniqueType,
  SerializedTrack,
  SerializedTuningNote,
  SerializedAccentKind,
  SerializedBeatTechniqueType,
} from "../tabui/v1/schema";
import {
  beatQuarters,
  DURATION_TO_BEAT_TYPE,
  DURATION_TO_TYPE,
  lcm,
  TONE_TO_GM_PROGRAM,
} from "./musicxml-mappings";
import { midiToPitch, tuningNoteToMidi } from "./musicxml-pitch";
import { element, textElement, writeXml, XmlElement } from "./xml-element";

const XML_HEADER =
  '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
  '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" ' +
  '"http://www.musicxml.org/dtds/partwise.dtd">\n';

/** One `<note>` before it is written, so later notes can still change it. */
type NoteDraft = {
  chord: boolean;
  /** MIDI pitch, or undefined for a rest. */
  midi?: number;
  dead: boolean;
  duration: number;
  voice: number;
  staff: number;
  beat: SerializedBeat;
  string?: number;
  fret?: number;
  tieStart: boolean;
  tieStop: boolean;
  tupletStart: boolean;
  tupletStop: boolean;
  palmMute: boolean;
  /** Children of `<notations>` other than ties, tuplets and technical. */
  notations: XmlElement[];
  ornaments: XmlElement[];
  technical: XmlElement[];
  articulations: XmlElement[];
};

/** The last note written on each string of a voice, with its source. */
type PreviousNotes = Map<
  number,
  { draft: NoteDraft; note: SerializedGuitarNote }
>;

/** A placeholder element and the note that will fill it. */
type PendingNote = { placeholder: XmlElement; draft: NoteDraft };

/** State that carries over from one bar to the next in a voice. */
type VoiceState = {
  dynamic: SerializedDynamic;
  previousNotes: PreviousNotes;
};

/** Returns the divisions per quarter note that make every beat a whole number. */
function getDivisions(document: SerializedScoreV1): number {
  let divisions = 1;
  for (const track of document.tracks) {
    for (const staff of track.staves) {
      for (const bar of staff.bars) {
        for (const voice of bar.voices) {
          for (const beat of voice?.beats ?? []) {
            const [, denominator] = beatQuarters(
              beat.duration,
              beat.dots,
              beat.tuplet
            );
            divisions = lcm(divisions, denominator);
          }
        }
      }
    }
  }
  return divisions;
}

function beatDivisions(beat: SerializedBeat, divisions: number): number {
  const [numerator, denominator] = beatQuarters(
    beat.duration,
    beat.dots,
    beat.tuplet
  );
  return (numerator * divisions) / denominator;
}

function pitchElement(midi: number): XmlElement {
  const pitch = midiToPitch(midi);
  return element("pitch", {}, [
    textElement("step", pitch.step),
    pitch.alter === 0 ? undefined : textElement("alter", pitch.alter),
    textElement("octave", pitch.octave),
  ]);
}

function tuningElement(line: number, note: SerializedTuningNote): XmlElement {
  const pitch = midiToPitch(tuningNoteToMidi(note));
  return element("staff-tuning", { line }, [
    textElement("tuning-step", pitch.step),
    pitch.alter === 0 ? undefined : textElement("tuning-alter", pitch.alter),
    textElement("tuning-octave", pitch.octave),
  ]);
}

function timeElement(masterBar: SerializedMasterBar): XmlElement {
  return element("time", {}, [
    textElement("beats", masterBar.beatsCount),
    textElement("beat-type", DURATION_TO_BEAT_TYPE[masterBar.duration]),
  ]);
}

function tempoDirection(tempo: number): XmlElement {
  return element("direction", { placement: "above" }, [
    element("direction-type", {}, [
      element("metronome", {}, [
        textElement("beat-unit", "quarter"),
        textElement("per-minute", tempo),
      ]),
    ]),
    element("sound", { tempo }),
  ]);
}

function dynamicDirection(
  dynamic: SerializedDynamic,
  voice: number,
  staff: number
): XmlElement {
  return element("direction", { placement: "below" }, [
    element("direction-type", {}, [
      element("dynamics", {}, [element(dynamic)]),
    ]),
    textElement("voice", voice),
    textElement("staff", staff),
  ]);
}

/**
 * Returns MusicXML `<bend>` elements for a bend. Like Guitar Pro, each
 * `<bend-alter>` is the pitch the bend reaches, in semitones above the
 * fretted note, so a release back to the fretted note is 0.
 */
function bendElements(options: SerializedBendOptions): XmlElement[] {
  const bend = (
    wholeTones: number,
    kind?: "pre-bend" | "release",
    duration?: number
  ): XmlElement =>
    element(
      "bend",
      {
        "last-beat":
          duration === undefined ? undefined : Math.round(duration * 100),
      },
      [
        textElement("bend-alter", wholeTones * 2),
        kind === undefined ? undefined : element(kind),
      ]
    );
  switch (options.type) {
    case SerializedBendType.Bend:
      return [bend(options.bendPitch, undefined, options.bendDuration)];
    case SerializedBendType.BendAndRelease:
      return [
        bend(options.bendPitch, undefined, options.bendDuration),
        bend(options.releasePitch, "release"),
      ];
    case SerializedBendType.Hold:
      return [bend(options.holdPitch, "pre-bend")];
    case SerializedBendType.Prebend:
      return [bend(options.prebendPitch, "pre-bend")];
    case SerializedBendType.PrebendAndRelease:
      return [
        bend(options.prebendPitch, "pre-bend"),
        bend(options.releasePitch, "release", options.bendDuration),
      ];
    case SerializedBendType.PrebendBend:
      return [
        bend(options.prebendPitch, "pre-bend"),
        bend(options.bendPitch, undefined, options.bendDuration),
      ];
    case SerializedBendType.Release:
      return [bend(options.releasePitch, "release", options.bendDuration)];
  }
}

/**
 * Returns the `<play>` element for a dead or palm-muted note. Guitar Pro
 * reads and writes these mutes, and needs them to play the note right.
 */
function playElement(draft: NoteDraft): XmlElement | undefined {
  const mutes = [
    draft.dead ? textElement("mute", "straight") : undefined,
    draft.palmMute ? textElement("mute", "palm") : undefined,
  ];
  const hasMute = mutes.some((v) => v !== undefined);
  return hasMute ? element("play", {}, mutes) : undefined;
}

function noteElement(draft: NoteDraft): XmlElement {
  const { beat } = draft;
  const tied: XmlElement[] = [];
  const ties: XmlElement[] = [];
  if (draft.tieStop) {
    ties.push(element("tie", { type: "stop" }));
    tied.push(element("tied", { type: "stop" }));
  }
  if (draft.tieStart) {
    ties.push(element("tie", { type: "start" }));
    tied.push(element("tied", { type: "start" }));
  }
  const tuplets: XmlElement[] = [];
  if (draft.tupletStart) {
    tuplets.push(element("tuplet", { type: "start" }));
  }
  if (draft.tupletStop) {
    tuplets.push(element("tuplet", { type: "stop" }));
  }
  const technical =
    draft.string === undefined
      ? draft.technical
      : [
          textElement("string", draft.string),
          textElement("fret", draft.fret ?? 0),
          ...draft.technical,
        ];
  const notations = [
    ...tied,
    ...tuplets,
    ...draft.notations,
    draft.ornaments.length === 0
      ? undefined
      : element("ornaments", {}, draft.ornaments),
    technical.length === 0 ? undefined : element("technical", {}, technical),
    draft.articulations.length === 0
      ? undefined
      : element("articulations", {}, draft.articulations),
  ].filter((child): child is XmlElement => child !== undefined);

  return element("note", {}, [
    draft.chord ? element("chord") : undefined,
    draft.midi === undefined ? element("rest") : pitchElement(draft.midi),
    textElement("duration", draft.duration),
    ...ties,
    textElement("voice", draft.voice),
    textElement("type", DURATION_TO_TYPE[beat.duration]),
    ...Array.from({ length: beat.dots }, () => element("dot")),
    beat.tuplet === null
      ? undefined
      : element("time-modification", {}, [
          textElement("actual-notes", beat.tuplet.normalCount),
          textElement("normal-notes", beat.tuplet.tupletCount),
        ]),
    draft.dead ? textElement("notehead", "x") : undefined,
    textElement("staff", draft.staff),
    notations.length === 0 ? undefined : element("notations", {}, notations),
    playElement(draft),
  ]);
}

function emptyDraft(
  beat: SerializedBeat,
  duration: number,
  voice: number,
  staff: number
): NoteDraft {
  return {
    chord: false,
    dead: false,
    duration,
    voice,
    staff,
    beat,
    tieStart: false,
    tieStop: false,
    tupletStart: false,
    tupletStop: false,
    palmMute: false,
    notations: [],
    ornaments: [],
    technical: [],
    articulations: [],
  };
}

/** Writes one part (track) of the score. */
class PartWriter {
  /** Carried-over state per voice, keyed by staff and voice index. */
  private readonly _voiceStates = new Map<string, VoiceState>();
  /** Notes written as placeholders, filled in by `finish`. */
  private readonly _pending: PendingNote[] = [];

  constructor(
    private readonly _document: SerializedScoreV1,
    private readonly _track: SerializedTrack,
    private readonly _trackIndex: number,
    private readonly _divisions: number
  ) {}

  public write(): XmlElement {
    const measures = this._document.masterBars.map((masterBar, index) =>
      this.writeMeasure(masterBar, index)
    );
    return element("part", { id: partId(this._trackIndex) }, measures);
  }

  private writeMeasure(
    masterBar: SerializedMasterBar,
    index: number
  ): XmlElement {
    const previous = this._document.masterBars[index - 1];
    const children: XmlElement[] = [];
    if (masterBar.isRepeatStart) {
      children.push(
        element("barline", { location: "left" }, [
          textElement("bar-style", "heavy-light"),
          element("repeat", { direction: "forward" }),
        ])
      );
    }
    const timeChanged =
      previous === undefined ||
      previous.beatsCount !== masterBar.beatsCount ||
      previous.duration !== masterBar.duration;
    if (index === 0) {
      children.push(this.firstAttributes(masterBar));
    } else if (timeChanged) {
      children.push(element("attributes", {}, [timeElement(masterBar)]));
    }
    if (
      this._trackIndex === 0 &&
      (previous === undefined || previous.tempo !== masterBar.tempo)
    ) {
      children.push(tempoDirection(masterBar.tempo));
    }

    let previousLength: number | undefined;
    for (const [staffIndex, staff] of this._track.staves.entries()) {
      for (const [voiceIndex, voice] of staff.bars[index].voices.entries()) {
        if (voice === null) {
          continue;
        }
        if (previousLength !== undefined && previousLength > 0) {
          children.push(
            element("backup", {}, [textElement("duration", previousLength)])
          );
        }
        previousLength = this.writeVoice(
          children,
          voice.beats,
          staffIndex,
          voiceIndex
        );
      }
    }

    if (masterBar.isRepeatEnd) {
      children.push(
        element("barline", { location: "right" }, [
          textElement("bar-style", "light-heavy"),
          element("repeat", {
            direction: "backward",
            times: masterBar.repeatCount ?? 2,
          }),
        ])
      );
    }
    return element("measure", { number: index + 1 }, children);
  }

  private firstAttributes(masterBar: SerializedMasterBar): XmlElement {
    const { instrument, staves } = this._track;
    const numbered = staves.length > 1;
    return element("attributes", {}, [
      textElement("divisions", this._divisions),
      element("key", {}, [textElement("fifths", 0)]),
      timeElement(masterBar),
      numbered ? textElement("staves", staves.length) : undefined,
      ...staves.map((_, index) =>
        element("clef", { number: numbered ? index + 1 : undefined }, [
          textElement("sign", "TAB"),
          textElement("line", 5),
        ])
      ),
      ...staves.map((_, index) =>
        element("staff-details", { number: numbered ? index + 1 : undefined }, [
          textElement("staff-lines", instrument.stringsCount),
          // Line 1 is the bottom line, which is the highest string number.
          ...[...instrument.tuning]
            .reverse()
            .map((note, line) => tuningElement(line + 1, note)),
        ])
      ),
    ]);
  }

  /** Writes a voice's beats for one bar and returns their total duration. */
  private writeVoice(
    children: XmlElement[],
    beats: SerializedBeat[],
    staffIndex: number,
    voiceIndex: number
  ): number {
    const key = `${staffIndex}:${voiceIndex}`;
    let state = this._voiceStates.get(key);
    if (state === undefined) {
      state = {
        dynamic: SerializedDynamic.MezzoForte,
        previousNotes: new Map(),
      };
      this._voiceStates.set(key, state);
    }
    const voice = staffIndex * 4 + voiceIndex + 1;
    const staff = staffIndex + 1;
    const tupletEdges = getTupletEdges(beats);
    let length = 0;

    for (const [beatIndex, beat] of beats.entries()) {
      const duration = beatDivisions(beat, this._divisions);
      length += duration;
      const dynamic = beat.dynamic ?? SerializedDynamic.MezzoForte;
      if (dynamic !== state.dynamic) {
        children.push(dynamicDirection(dynamic, voice, staff));
        state.dynamic = dynamic;
      }
      const drafts = this.beatDrafts(beat, duration, voice, staff, state);
      drafts[0].tupletStart = tupletEdges.starts.has(beatIndex);
      drafts[0].tupletStop = tupletEdges.stops.has(beatIndex);
      children.push(...drafts.map((v) => this.deferred(v)));
    }
    return length;
  }

  /**
   * Returns a placeholder element that is filled in when the score is
   * written, so later notes can still add tie and slide ends.
   */
  private deferred(draft: NoteDraft): XmlElement {
    const placeholder: XmlElement = { name: "", attributes: {}, children: [] };
    this._pending.push({ placeholder, draft });
    return placeholder;
  }

  /** Fills in every placeholder written by `deferred`. */
  public finish(): void {
    for (const { placeholder, draft } of this._pending) {
      Object.assign(placeholder, noteElement(draft));
    }
  }

  private beatDrafts(
    beat: SerializedBeat,
    duration: number,
    voice: number,
    staff: number,
    state: VoiceState
  ): NoteDraft[] {
    const previousNotes = state.previousNotes;
    state.previousNotes = new Map();
    const { tuning } = this._track.instrument;
    const playable = (beat.notes ?? [])
      .map((note, stringIndex) => ({ note, stringIndex }))
      .filter(
        (slot): slot is { note: SerializedGuitarNote; stringIndex: number } =>
          slot.note !== null && slot.note.fret !== null
      )
      // From the lowest-pitched string up.
      .reverse();
    if (playable.length === 0) {
      return [emptyDraft(beat, duration, voice, staff)];
    }

    const stroke = beat.techniques?.find(
      (technique) => technique.type === SerializedBeatTechniqueType.Stroke
    );
    return playable.map(({ note, stringIndex }, index) => {
      const fret = note.fret ?? 0;
      const dead = fret < 0;
      const draft = emptyDraft(beat, duration, voice, staff);
      draft.chord = index > 0;
      draft.dead = dead;
      draft.string = stringIndex + 1;
      draft.fret = dead ? 0 : fret;
      draft.midi = tuningNoteToMidi(tuning[stringIndex]) + draft.fret;

      const previous = previousNotes.get(stringIndex);
      this.addTechniques(draft, note, previous);
      if (stroke !== undefined) {
        draft.notations.push(
          element("arpeggiate", {
            // Stroke directions follow string order; arpeggios follow pitch.
            direction:
              stroke.options.direction === SerializedStrokeDirection.Down
                ? "up"
                : "down",
          })
        );
      }
      state.previousNotes.set(stringIndex, { draft, note });
      return draft;
    });
  }

  private addTechniques(
    draft: NoteDraft,
    note: SerializedGuitarNote,
    previous: { draft: NoteDraft; note: SerializedGuitarNote } | undefined
  ): void {
    const number = draft.string;
    if (previous !== undefined) {
      const previousTypes = previous.note.techniques.map((t) => t.type);
      if (previousTypes.includes(SerializedTechniqueType.HammerOnOrPullOff)) {
        const kind =
          (draft.fret ?? 0) > (previous.draft.fret ?? 0)
            ? "hammer-on"
            : "pull-off";
        const text = kind === "hammer-on" ? "H" : "P";
        previous.draft.technical.push(
          textElement(kind, text, { type: "start", number })
        );
        draft.technical.push(element(kind, { type: "stop", number }));
      }
      if (previousTypes.includes(SerializedTechniqueType.Slide)) {
        previous.draft.notations.push(
          element("slide", { type: "start", number, "line-type": "solid" })
        );
        draft.notations.push(element("slide", { type: "stop", number }));
      }
    }

    for (const technique of note.techniques) {
      switch (technique.type) {
        case SerializedTechniqueType.Tie:
          draft.tieStop = true;
          if (previous !== undefined) {
            previous.draft.tieStart = true;
          }
          break;
        case SerializedTechniqueType.Bend:
          draft.technical.push(...bendElements(technique.options));
          break;
        case SerializedTechniqueType.NaturalHarmonic:
          draft.technical.push(element("harmonic", {}, [element("natural")]));
          break;
        case SerializedTechniqueType.PinchHarmonic:
          // Guitar Pro reads artificial harmonics as its closest match.
          draft.technical.push(
            element("harmonic", {}, [element("artificial")])
          );
          break;
        case SerializedTechniqueType.PalmMute:
          draft.palmMute = true;
          break;
        case SerializedTechniqueType.LetRing:
          draft.technical.push(textElement("other-technical", "let ring"));
          break;
        case SerializedTechniqueType.Vibrato:
          draft.ornaments.push(
            element("wavy-line", { type: "start", number: 1 }),
            element("wavy-line", { type: "stop", number: 1 })
          );
          break;
        case SerializedTechniqueType.Tap:
          draft.technical.push(element("tap", { hand: "right" }));
          break;
        case SerializedTechniqueType.Accent:
          draft.articulations.push(
            element(
              technique.options.kind === SerializedAccentKind.Heavy
                ? "strong-accent"
                : "accent"
            )
          );
          break;
        // Written on the next note, when its fret is known.
        case SerializedTechniqueType.HammerOnOrPullOff:
        case SerializedTechniqueType.Slide:
          break;
      }
    }
  }
}

/**
 * Returns the beats that start and stop each tuplet group. Like the model,
 * consecutive beats with the same ratio form groups of `normalCount` beats.
 */
function getTupletEdges(beats: SerializedBeat[]): {
  starts: Set<number>;
  stops: Set<number>;
} {
  const starts = new Set<number>();
  const stops = new Set<number>();
  let groupStart = -1;
  let groupLength = 0;
  for (const [index, beat] of beats.entries()) {
    const previous = beats[index - 1]?.tuplet;
    const same =
      beat.tuplet !== null &&
      previous !== null &&
      previous !== undefined &&
      previous.normalCount === beat.tuplet.normalCount &&
      previous.tupletCount === beat.tuplet.tupletCount;
    if (beat.tuplet === null) {
      if (groupStart !== -1) {
        stops.add(index - 1);
      }
      groupStart = -1;
      continue;
    }
    if (!same || groupLength >= beat.tuplet.normalCount) {
      if (groupStart !== -1) {
        stops.add(index - 1);
      }
      groupStart = index;
      groupLength = 0;
      starts.add(index);
    }
    groupLength++;
  }
  if (groupStart !== -1) {
    stops.add(beats.length - 1);
  }
  return { starts, stops };
}

function partId(trackIndex: number): string {
  return `P${trackIndex + 1}`;
}

/** Returns a MIDI channel for a track, skipping the percussion channel 10. */
function midiChannel(trackIndex: number): number {
  const channel = (trackIndex % 15) + 1;
  return channel >= 10 ? channel + 1 : channel;
}

/**
 * Converts a track volume to a MusicXML `<volume>`. TabUI multiplies the
 * sound by the volume, while MusicXML volume is the MIDI channel volume,
 * which General MIDI turns into 40 * log10(volume) decibels. The square root
 * keeps the same loudness: 0.5 (-6 dB) is written as 70.71. MusicXML volume
 * can't go above 100%, so boosts above 0 dB are written as 100.
 */
function volumeToMidiPercent(volume: number): number {
  const percent = Math.min(1, Math.sqrt(volume)) * 100;
  return Math.round(percent * 100) / 100;
}

function scorePart(track: SerializedTrack, trackIndex: number): XmlElement {
  const id = partId(trackIndex);
  const instrumentId = `${id}-I1`;
  return element("score-part", { id }, [
    textElement("part-name", track.name),
    element("score-instrument", { id: instrumentId }, [
      textElement("instrument-name", track.instrument.name),
    ]),
    element("midi-instrument", { id: instrumentId }, [
      textElement("midi-channel", midiChannel(trackIndex)),
      textElement(
        "midi-program",
        TONE_TO_GM_PROGRAM[track.instrument.tone] + 1
      ),
      textElement("volume", volumeToMidiPercent(track.volume)),
      textElement("pan", Math.round(track.pan * 90)),
    ]),
  ]);
}

function identification(document: SerializedScoreV1): XmlElement {
  const fields: XmlElement[] = [];
  if (document.album !== undefined) {
    fields.push(
      textElement("miscellaneous-field", document.album, { name: "album" })
    );
  }
  if (document.releaseDate !== undefined) {
    fields.push(
      textElement("miscellaneous-field", document.releaseDate, {
        name: "release-date",
      })
    );
  }
  return element("identification", {}, [
    document.artist === ""
      ? undefined
      : textElement("creator", document.artist, { type: "artist" }),
    element("encoding", {}, [textElement("software", "TabUI")]),
    fields.length === 0 ? undefined : element("miscellaneous", {}, fields),
  ]);
}

/**
 * Writes a score as uncompressed MusicXML 4.0 (`.musicxml`).
 *
 * Every staff is written as a tab staff with its tuning, string, and fret
 * data. It follows Guitar Pro where the standard leaves room: palm mutes
 * are written as `<play><mute>palm</mute></play>`, pinch harmonics as
 * artificial harmonics, and bend pitches as the pitch each bend reaches.
 * Let ring has no MusicXML element, so it is written as `<other-technical>`
 * text that other apps may ignore. Empty Let Ring slots, stroke timing, and
 * the master volume are not written.
 * @throws If the score cannot be serialized.
 */
export function exportMusicXml(score: Score): string {
  const document = serializeScore(score);
  const divisions = getDivisions(document);
  const writers = document.tracks.map(
    (track, index) => new PartWriter(document, track, index, divisions)
  );
  const parts = writers.map((writer) => writer.write());
  for (const writer of writers) {
    writer.finish();
  }

  const root = element("score-partwise", { version: "4.0" }, [
    element("work", {}, [textElement("work-title", document.name)]),
    identification(document),
    element("part-list", {}, document.tracks.map(scorePart)),
    ...parts,
  ]);
  return `${XML_HEADER}${writeXml(root)}\n`;
}
