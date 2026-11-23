import { AccentOptions, AccentType } from "../../model/accent-options";
import { Beat } from "../../model/beat";
import { BeatGuitarTechnique } from "../../model/beat-guitar-technique";
import { BeatGuitarTechniqueType } from "../../model/beat-technique-type";
import {
  BendOptionsData,
  BendTechniqueOptions,
  MAX_BEND_PITCH,
} from "../../model/bend-options";
import { BendType } from "../../model/bend-type";
import { GuitarNote } from "../../model/guitar-note";
import { GuitarTechnique } from "../../model/guitar-technique";
import { Score } from "../../model/score";
import { deserializeScore } from "../tabui/v1/deserialize-score";
import {
  SCORE_SERIALIZATION_FORMAT,
  SCORE_SERIALIZATION_VERSION,
  SerializedBar,
  SerializedBeat,
  SerializedClefType,
  SerializedDynamic,
  SerializedGuitarInstrument,
  SerializedInstrumentFamily,
  SerializedMasterBar,
  SerializedNoteDuration,
  SerializedScoreV1,
  SerializedStaff,
  SerializedStringInstrumentTone,
  SerializedTrack,
  SerializedTuningNote,
  SerializedVoiceBar,
} from "../tabui/v1/schema";
import {
  DEFAULT_STROKE_DURATION,
  StrokeDirection,
  StrokeOptions,
} from "../../model/stroke-options";
import { GuitarTechniqueType } from "../../model/technique-type";
import { VoiceNumber } from "../../model/voice-bar";
import {
  DURATION_QUARTERS,
  DYNAMIC_NAMES,
  TONE_TO_FRETS,
  TONE_TO_TABUI_PROGRAM,
  TONE_TO_TYPE,
  TYPE_TO_DURATION,
} from "./musicxml-mappings";
import {
  midiToTuningNote,
  pitchToMidi,
  tuningNoteToMidi,
} from "./musicxml-pitch";

/** Thrown when a MusicXML file cannot be read or has nothing to import. */
export class MusicXmlImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MusicXmlImportError";
  }
}

/** The result of `importMusicXml`. */
export type MusicXmlImport = {
  /** The imported score. */
  score: Score;
  /**
   * Plain-English notes about content that was skipped, such as parts with
   * no tab staff or techniques that TabUI does not support.
   */
  warnings: string[];
};

/** A technique found on a note, added after the score is built. */
type PendingTechnique =
  | { kind: "tie" }
  | { kind: "simple"; type: GuitarTechniqueType }
  | { kind: "accent"; heavy: boolean }
  | { kind: "bend"; bends: BendStep[] };

/** One MusicXML `<bend>`, in semitones. */
type BendStep = {
  alter: number;
  preBend: boolean;
  release: boolean;
  lastBeat?: number;
};

type ImportedNote = {
  fret: number;
  techniques: PendingTechnique[];
};

type ImportedBeat = {
  /** Start time in quarter notes from the start of the bar. */
  start: number;
  /** Length in quarter notes. */
  length: number;
  duration: SerializedNoteDuration;
  dots: number;
  tuplet: { normalCount: number; tupletCount: number } | null;
  /** Notes by zero-based string index, or null for a rest. */
  notes: Map<number, ImportedNote> | null;
  stroke?: StrokeDirection;
  dynamic?: SerializedDynamic;
};

type MeasureInfo = {
  beatsCount?: number;
  beatType?: number;
  tempo?: number;
  repeatStart: boolean;
  repeatEnd: boolean;
  repeatTimes?: number;
};

type DynamicEvent = {
  measure: number;
  /** Time from the start of the bar, in quarter notes. */
  time: number;
  dynamic: SerializedDynamic;
  /** TabUI voice number as a string, or undefined for every voice of the staff. */
  voice?: string;
};

type PartData = {
  name: string;
  instrumentName?: string;
  program?: number;
  volume?: number;
  pan?: number;
};

/** Note techniques written as text, matched case-insensitively. */
const TEXT_TECHNIQUES: { pattern: RegExp; type: GuitarTechniqueType }[] = [
  {
    pattern: /^(palm[ -]?mute|p\.?\s?m\.?)$/i,
    type: GuitarTechniqueType.PalmMute,
  },
  {
    pattern: /^(let[ -]?ring|l\.?\s?r\.?)$/i,
    type: GuitarTechniqueType.LetRing,
  },
  {
    pattern: /^(pinch[ -]?harmonic|p\.?\s?h\.?|a\.?\s?h\.?)$/i,
    type: GuitarTechniqueType.PinchHarmonic,
  },
];

function children(parent: Element, name?: string): Element[] {
  return Array.from(parent.children).filter(
    (child) => name === undefined || child.localName === name
  );
}

function child(parent: Element, name: string): Element | undefined {
  return children(parent, name)[0];
}

function text(parent: Element, name: string): string | undefined {
  return child(parent, name)?.textContent?.trim();
}

function number(parent: Element, name: string): number | undefined {
  const value = text(parent, name);
  if (value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Finds the duration and dots of a length in quarter notes, without
 * tuplets. Returns undefined when no single note value matches.
 */
function lengthToDuration(
  length: number
): { duration: SerializedNoteDuration; dots: number } | undefined {
  for (const [duration, [numerator, denominator]] of Object.entries(
    DURATION_QUARTERS
  )) {
    for (let dots = 0; dots <= 2; dots++) {
      const scale = 2 ** dots;
      const value = ((numerator / denominator) * (2 * scale - 1)) / scale;
      if (Math.abs(value - length) < 1e-9) {
        return { duration: duration as SerializedNoteDuration, dots };
      }
    }
  }
  return undefined;
}

/** Splits a length in quarter notes into note values, longest first. */
function splitLength(
  length: number
): { duration: SerializedNoteDuration; dots: number; length: number }[] {
  const parts: {
    duration: SerializedNoteDuration;
    dots: number;
    length: number;
  }[] = [];
  let remaining = length;
  const values = Object.entries(DURATION_QUARTERS).map(
    ([duration, [numerator, denominator]]) => ({
      duration: duration as SerializedNoteDuration,
      length: numerator / denominator,
    })
  );
  for (const value of values) {
    while (remaining >= value.length - 1e-9) {
      parts.push({ duration: value.duration, dots: 0, length: value.length });
      remaining -= value.length;
    }
  }
  return parts;
}

function beatLength(
  duration: SerializedNoteDuration,
  dots: number,
  tuplet: ImportedBeat["tuplet"]
): number {
  const [numerator, denominator] = DURATION_QUARTERS[duration];
  const scale = 2 ** dots;
  let length = ((numerator / denominator) * (2 * scale - 1)) / scale;
  if (tuplet !== null) {
    length = (length * tuplet.tupletCount) / tuplet.normalCount;
  }
  return length;
}

function restBeat(
  start: number,
  part: { duration: SerializedNoteDuration; dots: number; length: number }
): ImportedBeat {
  return {
    start,
    length: part.length,
    duration: part.duration,
    dots: part.dots,
    tuplet: null,
    notes: null,
  };
}

/** Returns the TabUI tone for a part, from its MIDI program or its strings. */
function chooseTone(
  program: number | undefined,
  tuning: SerializedTuningNote[]
): SerializedStringInstrumentTone {
  const lowest = Math.min(...tuning.map(tuningNoteToMidi));
  const isUkulele = tuning.length === 4 && lowest >= 55;
  if (program !== undefined) {
    if (program === 24) {
      return isUkulele
        ? SerializedStringInstrumentTone.Ukulele
        : SerializedStringInstrumentTone.Nylon;
    }
    if (program === 25) {
      return SerializedStringInstrumentTone.Steel;
    }
    if (program >= 26 && program <= 28) {
      return SerializedStringInstrumentTone.ElectricClean;
    }
    if (program === 29) {
      return SerializedStringInstrumentTone.ElectricOverdrive;
    }
    if (program === 30 || program === 31) {
      return SerializedStringInstrumentTone.ElectricDistortion;
    }
    if (program === 32) {
      return SerializedStringInstrumentTone.BassAcoustic;
    }
    if (program === 36) {
      return SerializedStringInstrumentTone.BassDistortion;
    }
    if (program >= 33 && program <= 39) {
      return SerializedStringInstrumentTone.BassClean;
    }
    if (program === 105) {
      return SerializedStringInstrumentTone.Banjo;
    }
  }
  if (tuning.length === 5 && lowest >= 50) {
    return SerializedStringInstrumentTone.Banjo;
  }
  if (isUkulele) {
    return SerializedStringInstrumentTone.Ukulele;
  }
  if (lowest < 36) {
    return SerializedStringInstrumentTone.BassClean;
  }
  return SerializedStringInstrumentTone.ElectricClean;
}

/** Reads a staff tuning, ordered by string number (string 1 first). */
function readTuning(
  details: Element | undefined
): SerializedTuningNote[] | undefined {
  if (details === undefined) {
    return undefined;
  }
  const lines = children(details, "staff-tuning")
    .map((tuning) => {
      const line = Number(tuning.getAttribute("line"));
      const midi = pitchToMidi({
        step: text(tuning, "tuning-step") ?? "",
        alter: number(tuning, "tuning-alter") ?? 0,
        octave: number(tuning, "tuning-octave") ?? NaN,
      });
      return { line, midi };
    })
    .filter(
      (tuning): tuning is { line: number; midi: number } =>
        Number.isInteger(tuning.line) &&
        tuning.midi !== undefined &&
        Number.isFinite(tuning.midi)
    )
    .sort((a, b) => a.line - b.line);
  if (lines.length === 0) {
    return undefined;
  }
  // Line 1 is the bottom line, which is the highest string number.
  return lines.reverse().map((tuning) => midiToTuningNote(tuning.midi));
}

/** Returns whether a note has a `<play><mute>` of a kind, such as "palm". */
function hasMute(note: Element, kind: string): boolean {
  return children(note, "play")
    .flatMap((v) => children(v, "mute"))
    .some((v) => v.textContent?.trim() === kind);
}

function staffNumber(element: Element): number {
  return number(element, "staff") ?? 1;
}

function readDynamic(dynamics: Element): SerializedDynamic | undefined {
  for (const mark of children(dynamics)) {
    const name = mark.localName as SerializedDynamic;
    if (DYNAMIC_NAMES.includes(name)) {
      return name;
    }
  }
  return undefined;
}

/** Reads one `<part>` into TabUI staves. */
class PartReader {
  public readonly measures: MeasureInfo[] = [];
  /** Imported staves in order; each holds beats per bar per voice. */
  public readonly staves: Map<string, ImportedBeat[]>[][] = [];
  public tuning: SerializedTuningNote[] = [];
  public maxFret = 0;
  public skippedVoices = 0;
  public skippedNotes = 0;

  private readonly _tabStaves: number[] = [];
  /** TabUI voice numbers by MusicXML voice, per staff. */
  private readonly _voiceMaps = new Map<number, Map<string, number>>();
  private readonly _dynamics = new Map<number, DynamicEvent[]>();

  constructor(private readonly _part: Element) {}

  /** Returns false if the part has no tab staff. */
  public read(): boolean {
    const measures = children(this._part, "measure");
    this.findTabStaves(measures);
    if (this._tabStaves.length === 0) {
      return false;
    }
    for (let index = 0; index < this._tabStaves.length; index++) {
      this.staves.push([]);
    }
    let divisions = 1;
    for (const [measureIndex, measure] of measures.entries()) {
      divisions = this.readMeasure(measure, measureIndex, divisions);
    }
    this.applyDynamics();
    return true;
  }

  private findTabStaves(measures: Element[]): void {
    const clefs = new Map<number, string>();
    const details = new Map<number, Element>();
    for (const measure of measures) {
      for (const attributes of children(measure, "attributes")) {
        for (const clef of children(attributes, "clef")) {
          const staff = Number(clef.getAttribute("number") ?? 1);
          if (!clefs.has(staff)) {
            clefs.set(staff, text(clef, "sign") ?? "");
          }
        }
        for (const detail of children(attributes, "staff-details")) {
          const staff = Number(detail.getAttribute("number") ?? 1);
          if (!details.has(staff)) {
            details.set(staff, detail);
          }
        }
      }
    }
    for (const [staff, sign] of clefs) {
      if (sign.toUpperCase() === "TAB") {
        this._tabStaves.push(staff);
      }
    }
    if (this._tabStaves.length === 0) {
      // Some files mark tab staves only with a tuning.
      for (const [staff, detail] of details) {
        if (readTuning(detail) !== undefined) {
          this._tabStaves.push(staff);
        }
      }
    }
    this._tabStaves.sort((a, b) => a - b);
    const tuning =
      this._tabStaves
        .map((staff) => readTuning(details.get(staff)))
        .find((found) => found !== undefined) ?? undefined;
    if (tuning === undefined) {
      this._tabStaves.length = 0;
      return;
    }
    this.tuning = tuning;
  }

  private voiceNumber(staff: number, voice: string): number | undefined {
    let map = this._voiceMaps.get(staff);
    if (map === undefined) {
      map = new Map();
      this._voiceMaps.set(staff, map);
    }
    let mapped = map.get(voice);
    if (mapped === undefined) {
      if (map.size >= 4) {
        return undefined;
      }
      mapped = map.size + 1;
      map.set(voice, mapped);
    }
    return mapped;
  }

  /** Reads a measure and returns the divisions in effect after it. */
  private readMeasure(
    measure: Element,
    measureIndex: number,
    divisions: number
  ): number {
    const info: MeasureInfo = { repeatStart: false, repeatEnd: false };
    this.measures.push(info);
    const bars = this.staves.map(() => new Map<string, ImportedBeat[]>());
    for (const [index, staff] of this.staves.entries()) {
      staff.push(bars[index]);
    }
    const lastBeats = new Map<string, ImportedBeat>();
    const skippedVoices = new Set<string>();
    let time = 0;

    for (const item of children(measure)) {
      switch (item.localName) {
        case "attributes": {
          divisions = number(item, "divisions") ?? divisions;
          const timeElement = child(item, "time");
          if (timeElement !== undefined) {
            const beats = (text(timeElement, "beats") ?? "")
              .split("+")
              .reduce((sum, value) => sum + Number(value), 0);
            info.beatsCount = beats;
            info.beatType = number(timeElement, "beat-type");
          }
          break;
        }
        case "direction":
          this.readDirection(item, info, measureIndex, time, divisions);
          break;
        case "sound":
          info.tempo = Number(item.getAttribute("tempo") ?? NaN) || info.tempo;
          break;
        case "barline": {
          const repeat = child(item, "repeat");
          if (repeat?.getAttribute("direction") === "forward") {
            info.repeatStart = true;
          } else if (repeat?.getAttribute("direction") === "backward") {
            info.repeatEnd = true;
            const times = Number(repeat.getAttribute("times") ?? NaN);
            if (Number.isFinite(times)) {
              info.repeatTimes = times;
            }
          }
          break;
        }
        case "backup":
          time -= (number(item, "duration") ?? 0) / divisions;
          break;
        case "forward":
          time += (number(item, "duration") ?? 0) / divisions;
          break;
        case "note": {
          const length = (number(item, "duration") ?? 0) / divisions;
          const isChord = child(item, "chord") !== undefined;
          const start = isChord ? time - this._lastLength : time;
          if (!isChord) {
            time += length;
            this._lastLength = length;
          }
          if (
            child(item, "grace") !== undefined ||
            child(item, "cue") !== undefined
          ) {
            break;
          }
          const staffIndex = this._tabStaves.indexOf(staffNumber(item));
          if (staffIndex === -1) {
            break;
          }
          this.readNoteDynamics(item, staffIndex, measureIndex, start);
          const voiceId = text(item, "voice") ?? "1";
          const voice = this.voiceNumber(staffNumber(item), voiceId);
          const key = `${staffIndex}:${voiceId}`;
          if (voice === undefined) {
            if (!skippedVoices.has(key)) {
              skippedVoices.add(key);
              this.skippedVoices++;
            }
            break;
          }
          const voiceKey = String(voice);
          const bar = bars[staffIndex];
          let beats = bar.get(voiceKey);
          if (beats === undefined) {
            beats = [];
            bar.set(voiceKey, beats);
          }
          const lastBeat = lastBeats.get(key);
          if (isChord && lastBeat !== undefined) {
            this.addNote(lastBeat, item);
            break;
          }
          const beat = this.createBeat(item, start, length, beats);
          if (beat === undefined) {
            break;
          }
          beats.push(beat);
          lastBeats.set(key, beat);
          if (beat.notes !== null) {
            this.addNote(beat, item);
          }
          break;
        }
      }
    }
    return divisions;
  }

  /** Length of the last non-chord note, so chord notes find their start. */
  private _lastLength = 0;

  /** Adds a dynamics event for a staff. */
  private addDynamic(staffIndex: number, event: DynamicEvent): void {
    const events = this._dynamics.get(staffIndex) ?? [];
    events.push(event);
    this._dynamics.set(staffIndex, events);
  }

  /**
   * Reads a dynamics mark written on a note, as Guitar Pro writes them. Like a
   * printed mark, it applies to every voice of the staff from that note on.
   */
  private readNoteDynamics(
    note: Element,
    staffIndex: number,
    measureIndex: number,
    time: number
  ): void {
    for (const notation of children(note, "notations")) {
      const dynamics = child(notation, "dynamics");
      const dynamic = dynamics && readDynamic(dynamics);
      if (dynamic !== undefined) {
        this.addDynamic(staffIndex, { measure: measureIndex, time, dynamic });
      }
    }
  }

  private readDirection(
    direction: Element,
    info: MeasureInfo,
    measureIndex: number,
    time: number,
    divisions: number
  ): void {
    const offset = (number(direction, "offset") ?? 0) / divisions;
    for (const type of children(direction, "direction-type")) {
      const dynamics = child(type, "dynamics");
      if (dynamics !== undefined) {
        const dynamic = readDynamic(dynamics);
        const staff = staffNumber(direction);
        const staffIndex = this._tabStaves.indexOf(staff);
        if (dynamic !== undefined) {
          // A dynamic for another staff applies to every tab staff, and one
          // without a voice applies to every voice of its staff.
          const targets =
            staffIndex === -1 ? this._tabStaves.map((_, i) => i) : [staffIndex];
          const voiceId = text(direction, "voice");
          const voice =
            staffIndex === -1 || voiceId === undefined
              ? undefined
              : this.voiceNumber(staff, voiceId);
          for (const target of targets) {
            this.addDynamic(target, {
              measure: measureIndex,
              time: time + offset,
              dynamic,
              voice: voice === undefined ? undefined : String(voice),
            });
          }
        }
      }
      const metronome = child(type, "metronome");
      const perMinute = metronome && number(metronome, "per-minute");
      if (
        metronome !== undefined &&
        perMinute !== undefined &&
        info.tempo === undefined
      ) {
        const unit =
          TYPE_TO_DURATION[text(metronome, "beat-unit") ?? "quarter"];
        const dotted = child(metronome, "beat-unit-dot") !== undefined;
        if (unit !== undefined) {
          const [numerator, denominator] = DURATION_QUARTERS[unit];
          info.tempo =
            (perMinute * numerator * (dotted ? 1.5 : 1)) / denominator;
        }
      }
    }
    const sound = child(direction, "sound");
    const tempo = Number(sound?.getAttribute("tempo") ?? NaN);
    if (Number.isFinite(tempo) && tempo > 0) {
      info.tempo = tempo;
    }
  }

  /** Creates a beat for a note or rest, filling any gap before it with rests. */
  private createBeat(
    note: Element,
    start: number,
    length: number,
    beats: ImportedBeat[]
  ): ImportedBeat | undefined {
    const previous = beats[beats.length - 1];
    const end = previous === undefined ? 0 : previous.start + previous.length;
    if (start > end + 1e-9) {
      let gapStart = end;
      for (const part of splitLength(start - end)) {
        beats.push(restBeat(gapStart, part));
        gapStart += part.length;
      }
    }

    const isRest = child(note, "rest") !== undefined;
    const typeName = text(note, "type");
    const typed =
      typeName === undefined ? undefined : TYPE_TO_DURATION[typeName];
    const modification = child(note, "time-modification");
    const actual = modification && number(modification, "actual-notes");
    const normal = modification && number(modification, "normal-notes");
    const tuplet =
      actual !== undefined &&
      normal !== undefined &&
      Number.isInteger(actual) &&
      Number.isInteger(normal) &&
      actual >= 1 &&
      normal >= 1 &&
      actual <= 256 &&
      normal <= 256 &&
      actual !== normal
        ? { normalCount: actual, tupletCount: normal }
        : null;

    let duration: SerializedNoteDuration;
    let dots: number;
    if (typed !== undefined) {
      duration = typed;
      dots = Math.min(2, children(note, "dot").length);
    } else {
      const found = lengthToDuration(length);
      if (found === undefined) {
        if (!isRest || length <= 0) {
          this.skippedNotes++;
          return undefined;
        }
        // A whole-bar rest of an odd length: split it into several rests.
        const parts = splitLength(length);
        const last = parts.pop();
        let partStart = start;
        for (const part of parts) {
          beats.push(restBeat(partStart, part));
          partStart += part.length;
        }
        return last === undefined ? undefined : restBeat(partStart, last);
      }
      ({ duration, dots } = found);
    }

    return {
      start,
      length: beatLength(duration, dots, tuplet),
      duration,
      dots,
      tuplet: typed === undefined ? null : tuplet,
      notes: isRest ? null : new Map(),
    };
  }

  private addNote(beat: ImportedBeat, note: Element): void {
    if (beat.notes === null) {
      return;
    }
    const notations = children(note, "notations");
    const technical = notations.flatMap((n) => children(n, "technical"));
    const stringNumber = technical
      .map((t) => number(t, "string"))
      .find((value) => value !== undefined);
    const fret = technical
      .map((t) => number(t, "fret"))
      .find((value) => value !== undefined);
    if (
      stringNumber === undefined ||
      fret === undefined ||
      !Number.isInteger(stringNumber) ||
      !Number.isInteger(fret) ||
      stringNumber < 1 ||
      stringNumber > this.tuning.length ||
      fret < 0
    ) {
      this.skippedNotes++;
      return;
    }
    // Guitar Pro writes dead notes as a muted note with a normal notehead.
    const dead = text(note, "notehead") === "x" || hasMute(note, "straight");
    if (!dead) {
      this.maxFret = Math.max(this.maxFret, fret);
    }
    const imported: ImportedNote = {
      fret: dead ? -1 : fret,
      techniques: this.readTechniques(note, notations, technical),
    };
    beat.notes.set(stringNumber - 1, imported);

    for (const notation of notations) {
      const arpeggiate = child(notation, "arpeggiate");
      if (arpeggiate !== undefined) {
        // Arpeggios follow pitch; strokes follow string order.
        beat.stroke =
          arpeggiate.getAttribute("direction") === "down"
            ? StrokeDirection.Up
            : StrokeDirection.Down;
      }
    }
  }

  private readTechniques(
    note: Element,
    notations: Element[],
    technical: Element[]
  ): PendingTechnique[] {
    const types = new Set<GuitarTechniqueType>();
    const techniques: PendingTechnique[] = [];
    const isStart = (element: Element): boolean =>
      element.getAttribute("type") === "start";

    const tied =
      children(note, "tie").some(
        (tie) => tie.getAttribute("type") === "stop"
      ) ||
      notations.some((n) =>
        children(n, "tied").some((tie) => tie.getAttribute("type") === "stop")
      );
    if (tied) {
      techniques.push({ kind: "tie" });
    }
    // Guitar Pro writes palm mutes as a playback mute.
    const isPalmMuted = hasMute(note, "palm");
    if (isPalmMuted) {
      types.add(GuitarTechniqueType.PalmMute);
    }

    for (const notation of notations) {
      if (
        children(notation, "slide").some(isStart) ||
        children(notation, "glissando").some(isStart)
      ) {
        types.add(GuitarTechniqueType.Slide);
      }
      for (const ornaments of children(notation, "ornaments")) {
        if (
          children(ornaments, "wavy-line").some(isStart) ||
          child(ornaments, "vibrato") !== undefined
        ) {
          types.add(GuitarTechniqueType.Vibrato);
        }
      }
      for (const articulations of children(notation, "articulations")) {
        if (child(articulations, "strong-accent") !== undefined) {
          techniques.push({ kind: "accent", heavy: true });
        } else if (child(articulations, "accent") !== undefined) {
          techniques.push({ kind: "accent", heavy: false });
        }
      }
    }

    const bends: BendStep[] = [];
    for (const item of technical.flatMap((t) => children(t))) {
      switch (item.localName) {
        case "hammer-on":
        case "pull-off":
          if (isStart(item)) {
            types.add(GuitarTechniqueType.Legato);
          }
          break;
        case "harmonic":
          if (child(item, "artificial") !== undefined) {
            types.add(GuitarTechniqueType.PinchHarmonic);
          } else {
            types.add(GuitarTechniqueType.NaturalHarmonic);
          }
          break;
        case "tap":
          types.add(GuitarTechniqueType.Tap);
          break;
        case "bend": {
          const lastBeat = Number(item.getAttribute("last-beat") ?? NaN);
          bends.push({
            alter: number(item, "bend-alter") ?? 0,
            preBend: child(item, "pre-bend") !== undefined,
            release: child(item, "release") !== undefined,
            lastBeat: Number.isFinite(lastBeat) ? lastBeat : undefined,
          });
          break;
        }
        case "other-technical": {
          const value = item.textContent?.trim() ?? "";
          const match = TEXT_TECHNIQUES.find((t) => t.pattern.test(value));
          if (match !== undefined) {
            types.add(match.type);
          }
          break;
        }
      }
    }
    if (bends.length > 0) {
      techniques.push({ kind: "bend", bends });
    }
    for (const type of types) {
      techniques.push({ kind: "simple", type });
    }
    return techniques;
  }

  /** Sets each beat's dynamic from the dynamics marks before it. */
  private applyDynamics(): void {
    for (const [staffIndex, bars] of this.staves.entries()) {
      const events = (this._dynamics.get(staffIndex) ?? []).sort(
        (a, b) => a.measure - b.measure || a.time - b.time
      );
      const voices = new Set(bars.flatMap((v) => Array.from(v.keys())));
      for (const voice of voices) {
        const voiceEvents = events.filter(
          (v) => v.voice === undefined || v.voice === voice
        );
        let current = SerializedDynamic.MezzoForte;
        let eventIndex = 0;
        for (const [measure, bar] of bars.entries()) {
          for (const beat of bar.get(voice) ?? []) {
            while (
              eventIndex < voiceEvents.length &&
              (voiceEvents[eventIndex].measure < measure ||
                (voiceEvents[eventIndex].measure === measure &&
                  voiceEvents[eventIndex].time <= beat.start + 1e-9))
            ) {
              current = voiceEvents[eventIndex].dynamic;
              eventIndex++;
            }
            beat.dynamic = current;
          }
        }
      }
    }
  }
}

function readPartList(root: Element): Map<string, PartData> {
  const parts = new Map<string, PartData>();
  const partList = child(root, "part-list");
  for (const scorePart of partList === undefined
    ? []
    : children(partList, "score-part")) {
    const id = scorePart.getAttribute("id") ?? "";
    const midi = child(scorePart, "midi-instrument");
    const scoreInstrument = child(scorePart, "score-instrument");
    const program = midi && number(midi, "midi-program");
    parts.set(id, {
      name: text(scorePart, "part-name") ?? "",
      instrumentName:
        scoreInstrument && text(scoreInstrument, "instrument-name"),
      program: program === undefined ? undefined : program - 1,
      volume: midi && number(midi, "volume"),
      pan: midi && number(midi, "pan"),
    });
  }
  return parts;
}

function readMetadata(
  root: Element
): Pick<SerializedScoreV1, "name" | "artist" | "album" | "releaseDate"> {
  const work = child(root, "work");
  const identification = child(root, "identification");
  const creators =
    identification === undefined ? [] : children(identification, "creator");
  const creator = (type: string): string | undefined =>
    creators.find((c) => c.getAttribute("type") === type)?.textContent?.trim();
  const misc = identification && child(identification, "miscellaneous");
  const field = (name: string): string | undefined =>
    misc === undefined
      ? undefined
      : children(misc, "miscellaneous-field")
          .find((f) => f.getAttribute("name") === name)
          ?.textContent?.trim();
  const releaseDate = field("release-date");
  return {
    name:
      (work && text(work, "work-title")) || text(root, "movement-title") || "",
    artist: creator("artist") ?? creator("composer") ?? "",
    album: field("album") || undefined,
    releaseDate:
      releaseDate !== undefined && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(releaseDate)
        ? releaseDate
        : undefined,
  };
}

const BEAT_TYPE_TO_DURATION: Record<number, SerializedNoteDuration> = {
  1: SerializedNoteDuration.Whole,
  2: SerializedNoteDuration.Half,
  4: SerializedNoteDuration.Quarter,
  8: SerializedNoteDuration.Eighth,
  16: SerializedNoteDuration.Sixteenth,
  32: SerializedNoteDuration.ThirtySecond,
  64: SerializedNoteDuration.SixtyFourth,
};

/** Builds master bars from the measures of every part. */
function buildMasterBars(
  readers: PartReader[],
  warnings: string[]
): SerializedMasterBar[] {
  const count = Math.max(...readers.map((reader) => reader.measures.length));
  const masterBars: SerializedMasterBar[] = [];
  let beatsCount = 4;
  let duration = SerializedNoteDuration.Quarter;
  let tempo = 120;
  let badTime = false;
  for (let index = 0; index < count; index++) {
    const infos = readers
      .map((reader) => reader.measures[index])
      .filter((info): info is MeasureInfo => info !== undefined);
    const timed = infos.find((info) => info.beatsCount !== undefined);
    if (timed?.beatsCount !== undefined) {
      const beatType =
        timed.beatType === undefined
          ? undefined
          : BEAT_TYPE_TO_DURATION[timed.beatType];
      if (
        beatType === undefined ||
        !Number.isInteger(timed.beatsCount) ||
        timed.beatsCount < 1 ||
        timed.beatsCount > 32
      ) {
        badTime = true;
      } else {
        beatsCount = timed.beatsCount;
        duration = beatType;
      }
    }
    const tempoInfo = infos.find((info) => info.tempo !== undefined);
    if (tempoInfo?.tempo !== undefined) {
      tempo = clamp(Math.round(tempoInfo.tempo), 1, 999);
    }
    const repeatEnd = infos.find((info) => info.repeatEnd);
    masterBars.push({
      tempo,
      beatsCount,
      duration,
      isRepeatStart: infos.some((info) => info.repeatStart),
      isRepeatEnd: repeatEnd !== undefined,
      repeatCount:
        repeatEnd === undefined
          ? null
          : clamp(Math.round(repeatEnd.repeatTimes ?? 2), 2, 32),
    });
  }
  if (badTime) {
    warnings.push(
      "Some time signatures are not supported and were not changed."
    );
  }
  return masterBars;
}

/**
 * Converts a MusicXML `<volume>` (MIDI channel volume, in percent) to a track
 * volume with the same loudness. Rounded to hundredths, like the volume
 * slider's steps.
 */
function midiPercentToVolume(percent: number): number {
  const volume = clamp(percent / 100, 0, 1) ** 2;
  return Math.round(volume * 100) / 100;
}

/** Builds a serialized track, leaving note techniques for later. */
function buildTrack(
  reader: PartReader,
  part: PartData | undefined,
  masterBarCount: number
): SerializedTrack {
  const tone = chooseTone(part?.program, reader.tuning);
  const name = part?.name || part?.instrumentName || "Track";
  const instrument = {
    family: SerializedInstrumentFamily.Strings,
    type: TONE_TO_TYPE[tone],
    tone,
    name: part?.instrumentName || name,
    program: TONE_TO_TABUI_PROGRAM[tone],
    stringsCount: reader.tuning.length,
    fretsCount: Math.max(TONE_TO_FRETS[tone], reader.maxFret),
    tuning: reader.tuning,
  } as SerializedGuitarInstrument;

  const staves: SerializedStaff[] = reader.staves.map((bars) => ({
    clefType: SerializedClefType.Treble,
    showTablature: true,
    showClassicNotation: false,
    bars: Array.from({ length: masterBarCount }, (_, index) =>
      buildBar(bars[index], reader.tuning.length)
    ),
  }));

  return {
    instrument,
    name,
    volume: part?.volume === undefined ? 0.5 : midiPercentToVolume(part.volume),
    pan: part?.pan === undefined ? 0 : clamp(part.pan / 90, -1, 1),
    muted: false,
    soloed: false,
    staves,
  };
}

function buildBar(
  voices: Map<string, ImportedBeat[]> | undefined,
  stringsCount: number
): SerializedBar {
  const slots: SerializedBar["voices"] = [null, null, null, null];
  for (const [voice, beats] of voices ?? []) {
    if (beats.length > 0) {
      slots[Number(voice) - 1] = {
        beats: beats.map((beat) => buildBeat(beat, stringsCount)),
      } satisfies SerializedVoiceBar;
    }
  }
  if (slots.every((slot) => slot === null)) {
    slots[0] = {
      beats: [
        {
          notes: null,
          duration: SerializedNoteDuration.Quarter,
          dots: 0,
          tuplet: null,
        },
      ],
    };
  }
  return { voices: slots };
}

function buildBeat(beat: ImportedBeat, stringsCount: number): SerializedBeat {
  const serialized: SerializedBeat = {
    notes:
      beat.notes === null
        ? null
        : Array.from({ length: stringsCount }, (_, index) => {
            const note = beat.notes?.get(index);
            return note === undefined
              ? null
              : { fret: note.fret, techniques: [] };
          }),
    duration: beat.duration,
    dots: beat.dots,
    tuplet: beat.tuplet,
  };
  if (
    beat.dynamic !== undefined &&
    beat.dynamic !== SerializedDynamic.MezzoForte
  ) {
    serialized.dynamic = beat.dynamic;
  }
  return serialized;
}

/**
 * Converts MusicXML bends to TabUI bend options. Guitar Pro writes each
 * `<bend-alter>` as the pitch the bend reaches, in semitones above the
 * fretted note, so a release to the fretted note is 0. Negative values are
 * read as a change from the previous pitch, as the MusicXML standard
 * describes them.
 * @param startPitch The pitch the note starts at, in whole tones, when it
 *   continues a tied bend.
 */
function bendOptions(
  bends: BendStep[],
  startPitch: number
): BendOptionsData | undefined {
  // Pitches in semitones until the end.
  const reached = (step: BendStep, from: number): number =>
    step.alter < 0 ? from + step.alter : step.alter;
  const toPitch = (semitones: number): number =>
    clamp(semitones / 2, 0, MAX_BEND_PITCH);
  const duration = (step: BendStep): number =>
    step.lastBeat === undefined ? 1 : clamp(step.lastBeat / 100, 0.01, 1);

  const [first, second] = bends;
  const start = startPitch * 2;
  if (first.preBend) {
    const prebend = reached(first, 0);
    // Guitar Pro writes a tied note that stays bent as a pre-bend.
    const isHold = second === undefined && start > 0 && prebend === start;
    if (isHold) {
      return { type: BendType.Hold, holdPitch: startPitch, bendDuration: 1 };
    }
    if (second === undefined) {
      return { type: BendType.Prebend, prebendPitch: toPitch(prebend) };
    }
    const target = reached(second, prebend);
    const isRelease = second.release || target < prebend;
    return isRelease
      ? {
          type: BendType.PrebendAndRelease,
          prebendPitch: toPitch(prebend),
          releasePitch: toPitch(target),
          bendDuration: duration(second),
        }
      : {
          type: BendType.PrebendBend,
          prebendPitch: toPitch(prebend),
          bendPitch: toPitch(target),
          bendDuration: duration(second),
        };
  }

  const target = reached(first, start);
  if (first.release || target < start) {
    return {
      type: BendType.Release,
      releasePitch: toPitch(target),
      bendDuration: duration(first),
    };
  }
  if (target === start) {
    return startPitch > 0
      ? { type: BendType.Hold, holdPitch: startPitch, bendDuration: 1 }
      : undefined;
  }
  if (second !== undefined) {
    const release = reached(second, target);
    if (second.release || release < target) {
      return {
        type: BendType.BendAndRelease,
        bendPitch: toPitch(target),
        releasePitch: toPitch(release),
        bendDuration: duration(first),
      };
    }
  }
  return {
    type: BendType.Bend,
    bendPitch: toPitch(target),
    bendDuration: duration(first),
  };
}

/** Adds one technique to a note, returning false if TabUI rejects it. */
function addTechnique(note: GuitarNote, technique: PendingTechnique): boolean {
  try {
    switch (technique.kind) {
      case "tie":
        return note.addTechnique(
          new GuitarTechnique(note, GuitarTechniqueType.Tie)
        );
      case "simple":
        return note.addTechnique(new GuitarTechnique(note, technique.type));
      case "accent":
        return note.addTechnique(
          new GuitarTechnique(
            note,
            GuitarTechniqueType.Accent,
            new AccentOptions({
              kind: technique.heavy ? AccentType.Heavy : AccentType.Normal,
            })
          )
        );
      case "bend": {
        const options = bendOptions(
          technique.bends,
          note.getBendContinuationPitch() ?? 0
        );
        return (
          options !== undefined &&
          note.addTechnique(
            new GuitarTechnique(
              note,
              GuitarTechniqueType.Bend,
              new BendTechniqueOptions(options)
            )
          )
        );
      }
    }
  } catch {
    return false;
  }
}

/** An imported beat with the model beat built from it. */
type BeatPair = { beat: ImportedBeat; modelBeat: Beat };

/** Pairs every imported beat with its model beat, in score order. */
function pairBeats(score: Score, readers: PartReader[]): BeatPair[] {
  const pairs: BeatPair[] = [];
  for (const [trackIndex, reader] of readers.entries()) {
    const staves = score.tracks[trackIndex].staves;
    for (const [staffIndex, bars] of reader.staves.entries()) {
      for (const [barIndex, voices] of bars.entries()) {
        const bar = staves[staffIndex].bars[barIndex];
        for (const [voice, beats] of voices) {
          const voiceBar = bar.getVoiceBar(Number(voice) as VoiceNumber);
          for (const [beatIndex, beat] of beats.entries()) {
            const modelBeat = voiceBar?.beats[beatIndex];
            if (modelBeat !== undefined) {
              pairs.push({ beat, modelBeat });
            }
          }
        }
      }
    }
  }
  return pairs;
}

function addStroke(beat: Beat, direction: StrokeDirection): boolean {
  try {
    const options = new StrokeOptions({
      direction,
      duration: DEFAULT_STROKE_DURATION,
    });
    return beat.addBeatTechnique(
      new BeatGuitarTechnique(beat, BeatGuitarTechniqueType.Stroke, options)
    );
  } catch {
    return false;
  }
}

/**
 * Adds the techniques of every imported note and beat to the score, and
 * returns how many TabUI rejected.
 */
function addTechniques(score: Score, readers: PartReader[]): number {
  const pairs = pairBeats(score, readers);
  let skipped = 0;
  // Ties go first, so bends can see the pitch they continue from.
  for (const isTiePass of [true, false]) {
    for (const { beat, modelBeat } of pairs) {
      for (const [stringIndex, note] of beat.notes ?? []) {
        const modelNote = modelBeat.notes?.[stringIndex];
        if (!(modelNote instanceof GuitarNote)) {
          continue;
        }
        const techniques = note.techniques.filter(
          (t) => (t.kind === "tie") === isTiePass
        );
        for (const technique of techniques) {
          skipped += addTechnique(modelNote, technique) ? 0 : 1;
        }
      }
      if (!isTiePass && beat.stroke !== undefined) {
        skipped += addStroke(modelBeat, beat.stroke) ? 0 : 1;
      }
    }
  }
  return skipped;
}

/**
 * Reads an uncompressed MusicXML file (`.musicxml` or `.xml`) into a score.
 *
 * Only parts with a tab staff are imported: each needs a TAB clef or a staff
 * tuning, and string and fret data on its notes. Other parts are skipped with
 * a warning. Each tab staff of a part becomes a staff of the track, and up
 * to four voices per staff are kept. Compressed `.mxl` files are not
 * supported; extract the `.musicxml` file from them first.
 *
 * Requires `DOMParser`, which browsers provide.
 * @throws MusicXmlImportError if the file is not valid MusicXML, uses the
 *   timewise format, or has no part with a tab staff.
 */
export function importMusicXml(xml: string): MusicXmlImport {
  if (typeof DOMParser === "undefined") {
    throw new MusicXmlImportError(
      "MusicXML import needs DOMParser, which browsers provide"
    );
  }
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.getElementsByTagName("parsererror").length > 0) {
    throw new MusicXmlImportError("The file is not valid XML");
  }
  const root = document.documentElement;
  if (root.localName === "score-timewise") {
    throw new MusicXmlImportError("Timewise MusicXML files are not supported");
  }
  if (root.localName !== "score-partwise") {
    throw new MusicXmlImportError("The file is not a MusicXML score");
  }

  const warnings: string[] = [];
  const partData = readPartList(root);
  const readers: PartReader[] = [];
  const parts: (PartData | undefined)[] = [];
  for (const part of children(root, "part")) {
    const data = partData.get(part.getAttribute("id") ?? "");
    const reader = new PartReader(part);
    if (!reader.read()) {
      warnings.push(
        `Skipped "${data?.name || "Unnamed part"}": it has no tab staff.`
      );
      continue;
    }
    readers.push(reader);
    parts.push(data);
  }
  if (readers.length === 0) {
    throw new MusicXmlImportError("The file has no part with a tab staff");
  }

  const masterBars = buildMasterBars(readers, warnings);
  const serialized: SerializedScoreV1 = {
    format: SCORE_SERIALIZATION_FORMAT,
    version: SCORE_SERIALIZATION_VERSION,
    ...readMetadata(root),
    masterVolume: 0.5,
    masterPan: 0,
    masterBars,
    tracks: readers.map((reader, index) =>
      buildTrack(reader, parts[index], masterBars.length)
    ),
  };
  if (serialized.album === undefined) {
    delete serialized.album;
  }
  if (serialized.releaseDate === undefined) {
    delete serialized.releaseDate;
  }

  let score: Score;
  try {
    score = deserializeScore(serialized);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MusicXmlImportError(`The score could not be built: ${message}`);
  }

  const skippedTechniques = addTechniques(score, readers);
  const skippedNotes = readers.reduce(
    (sum, reader) => sum + reader.skippedNotes,
    0
  );
  const skippedVoices = readers.reduce(
    (sum, reader) => sum + reader.skippedVoices,
    0
  );
  if (skippedNotes > 0) {
    warnings.push(`Skipped ${skippedNotes} notes without a string and fret.`);
  }
  if (skippedVoices > 0) {
    warnings.push(
      `Skipped ${skippedVoices} voices beyond the fourth on a staff.`
    );
  }
  if (skippedTechniques > 0) {
    warnings.push(
      `Skipped ${skippedTechniques} techniques that TabUI cannot place.`
    );
  }
  return { score, warnings };
}
