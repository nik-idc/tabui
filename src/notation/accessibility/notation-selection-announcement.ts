import {
  AccentType,
  Beat,
  type BeatGuitarTechniqueOptionsByType,
  BeatGuitarTechniqueType,
  BendType,
  DURATION_TO_DESC,
  DYNAMIC_NAMES,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteValue,
  type Staff,
  type Track,
  type VoiceBar,
} from "../model";
import { SelectionCursor } from "../controller";
import { describeStroke } from "./stroke-description";

/** Selection state read by the announcement formatters. */
export interface NotationSelectionSource {
  readonly selectionCursor: SelectionCursor | undefined;
  readonly selectionAsBeats: Beat[];
  readonly selectionEndBeat: Beat | undefined;
}

const TECHNIQUE_NAMES: Record<GuitarTechniqueType, string> = {
  [GuitarTechniqueType.Bend]: "bend",
  [GuitarTechniqueType.Legato]: "legato",
  [GuitarTechniqueType.LetRing]: "let ring",
  [GuitarTechniqueType.Tie]: "tie",
  [GuitarTechniqueType.NaturalHarmonic]: "natural harmonic",
  [GuitarTechniqueType.PalmMute]: "palm mute",
  [GuitarTechniqueType.PinchHarmonic]: "pinch harmonic",
  [GuitarTechniqueType.Slide]: "slide",
  [GuitarTechniqueType.Vibrato]: "vibrato",
  [GuitarTechniqueType.Tap]: "tap",
  [GuitarTechniqueType.Accent]: "accent",
};

const BEND_TYPE_NAMES: Record<BendType, string> = {
  [BendType.Bend]: "bend",
  [BendType.BendAndRelease]: "bend and release",
  [BendType.Hold]: "hold bend",
  [BendType.Prebend]: "prebend",
  [BendType.PrebendAndRelease]: "prebend and release",
  [BendType.PrebendBend]: "prebend to bend",
  [BendType.Release]: "release bend",
};

/** Stable slot identities retained across mutable cursor navigation. */
export interface NotationCursorPosition {
  readonly stringNumber: number;
  readonly voiceNumber: number;
  readonly trackUuid: number;
  readonly staffUuid: number;
  readonly barUuid: number;
  readonly beatUuid: number;
}

/** Captures slot identities before navigation mutates the cursor. */
export function captureSelectionCursor(
  cursor: SelectionCursor | undefined
): NotationCursorPosition | undefined {
  if (cursor === undefined || cursor.beat === undefined) {
    return undefined;
  }

  const beat = cursor.beat;
  const voiceBar = beat.voiceBar;
  const bar = voiceBar.bar;
  const staff = bar.staff;
  const track = staff.track;
  return {
    stringNumber: cursor.noteIndex + 1,
    voiceNumber: voiceBar.voiceNumber,
    trackUuid: track.uuid,
    staffUuid: staff.uuid,
    barUuid: bar.uuid,
    beatUuid: beat.uuid,
  };
}

/** Formats a range endpoint from its current model ownership. */
function formatRangeEndpoint(beat: Beat): string {
  const bar = beat.voiceBar.bar;
  const staff = bar.staff;
  return `bar ${staff.bars.indexOf(bar) + 1} beat ${beat.voiceBar.beats.indexOf(beat) + 1}`;
}

/** Reports whether two positions identify the same slot, including absence. */
export function notationSelectionsEqual(
  first: NotationCursorPosition | undefined,
  second: NotationCursorPosition | undefined
): boolean {
  return (
    first?.trackUuid === second?.trackUuid &&
    first?.staffUuid === second?.staffUuid &&
    first?.barUuid === second?.barUuid &&
    first?.voiceNumber === second?.voiceNumber &&
    first?.beatUuid === second?.beatUuid &&
    first?.stringNumber === second?.stringNumber
  );
}

/** Describes the options of each beat technique type for screen readers. */
const BEAT_TECHNIQUE_DESCRIBERS: {
  [T in BeatGuitarTechniqueType]: (
    options: BeatGuitarTechniqueOptionsByType[T]
  ) => string;
} = {
  [BeatGuitarTechniqueType.Stroke]: describeStroke,
};

/** Describes one beat technique with the describer of its type. */
function describeBeatTechnique<T extends BeatGuitarTechniqueType>(
  type: T,
  options: BeatGuitarTechniqueOptionsByType[T]
): string {
  return BEAT_TECHNIQUE_DESCRIBERS[type](options);
}

/** Formats the beat's techniques, if any, as a suffix. */
function formatBeatTechniques(beat: Beat): string {
  return beat.beatTechniques
    .map((t) => `, ${describeBeatTechnique(t.type, t.options)}`)
    .join("");
}

/**
 * Names the beat's dynamic only where it changes from the previous beat in the
 * voice (or from mf at the start), as printed music does.
 */
function formatDynamicChange(beat: Beat): string {
  const index = beat.voiceBar.beats.indexOf(beat);
  if (beat.dynamic === beat.voiceBar.getInheritedDynamic(index)) {
    return "";
  }
  return `, ${DYNAMIC_NAMES[beat.dynamic].toLowerCase()}`;
}

/**
 * Names the dynamic of the active beat (range end, cursor beat, or last selected
 * beat) for a spoken confirmation after a dynamic edit.
 */
export function formatActiveDynamic(
  source: NotationSelectionSource
): string | undefined {
  const beat =
    source.selectionEndBeat ??
    source.selectionCursor?.beat ??
    source.selectionAsBeats.at(-1);
  if (beat === undefined) {
    return undefined;
  }
  return `Dynamic ${DYNAMIC_NAMES[beat.dynamic].toLowerCase()}`;
}

/** Formats duration and optional rhythm details. */
function formatRhythm(beat: Beat): string {
  const duration = DURATION_TO_DESC[beat.baseDuration].toLowerCase();
  const dots =
    beat.dots === 0 ? "" : `, ${beat.dots} dot${beat.dots === 1 ? "" : "s"}`;
  const tuplet =
    beat.tupletSettings === null
      ? ""
      : `, ${beat.tupletSettings.normalCount}:${beat.tupletSettings.tupletCount} tuplet`;
  return `${duration}${dots}${tuplet}`;
}

/** Formats techniques, including the highest defined bend pitch. */
function formatTechniques(note: GuitarNote): string {
  if (note.techniques.length === 0) {
    return "";
  }
  const names = note.techniques.map((technique) => {
    const name = TECHNIQUE_NAMES[technique.type];
    if (technique.accentOptions?.kind === AccentType.Heavy) {
      return `heavy ${name}`;
    }
    if (
      !(technique instanceof GuitarTechnique) ||
      technique.bendOptions === null
    ) {
      return name;
    }
    const options = technique.bendOptions;
    const pitches = [
      options.bendPitch,
      options.releasePitch,
      options.holdPitch,
      options.prebendPitch,
    ].filter((pitch): pitch is number => pitch !== undefined);
    const pitch = Math.max(...pitches);
    return `${BEND_TYPE_NAMES[options.type]} ${pitch} ${pitch === 1 ? "tone" : "tones"}`;
  });
  return `, ${names.join(", ")}`;
}

/** Formats the selected string or polyphonic lane. */
function formatNoteSlot(selection: SelectionCursor): string {
  const beat = selection.beat;
  const prefix =
    `${beat.trackContext.instrument instanceof Guitar ? "String" : "Lane"}` +
    ` ${selection.noteIndex + 1}`;
  if (beat.isRest()) {
    return `${prefix}, rest.`;
  }
  const note = beat.notes?.[selection.noteIndex] ?? null;
  if (note === null || note.noteValue === NoteValue.None) {
    return `${prefix}, empty.`;
  }
  if (note.noteValue === NoteValue.Dead) {
    return `${prefix}, dead note.`;
  }
  return note instanceof GuitarNote
    ? `${prefix}, fret ${note.fret}${formatTechniques(note)}.`
    : `${prefix}.`;
}

function formatRepeats(beat: Beat): string {
  const bar = beat.voiceBar.bar.masterBar;
  if (!bar.isRepeatStart && !bar.isRepeatEnd) {
    return "";
  }
  if (bar.isRepeatStart && bar.isRepeatEnd) {
    return (
      `, repeat start, repeat end ${bar.repeatCount}` +
      ` ${bar.repeatCount === 1 ? "time" : "times"}`
    );
  }
  return bar.isRepeatStart
    ? ", repeat start"
    : `, repeat end ${bar.repeatCount} ${bar.repeatCount === 1 ? "time" : "times"}`;
}

/** Spoken bar, beat, and note slot text, kept to tell what an edit changed. */
export interface NotationSelectionText {
  readonly bar: string;
  readonly beat: string;
  readonly slot: string;
}

/** Spoken layers of a cursor selection, outermost first. */
interface CursorLayers extends NotationSelectionText {
  readonly track: string;
  /** Undefined when the track has one staff. */
  readonly staff: string | undefined;
  /** Undefined when voice 1 is the staff's only voice with notes. */
  readonly voice: string | undefined;
  readonly voiceNumber: number;
}

function formatTrackName(track: Track): string {
  return track.name.trim() === ""
    ? `${track.score.tracks.indexOf(track) + 1}`
    : track.name;
}

/** Names the staff unless the track has only one. */
function formatStaff(staff: Staff): string | undefined {
  const staves = staff.track.staves;
  return staves.length === 1 ? undefined : `Staff ${staves.indexOf(staff) + 1}`;
}

/** Names the voice unless it is voice 1 and no other voice has notes. */
function formatVoice(voiceBar: VoiceBar): string | undefined {
  const voiceNumber = voiceBar.voiceNumber;
  const onlyVoice =
    voiceNumber === 1 &&
    voiceBar.bar.staff.nonEmptyVoiceNumbers.every((number) => number === 1);
  return onlyVoice ? undefined : `voice ${voiceNumber}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Joins spoken parts, skipping the ones left out. */
function joinParts(parts: (string | undefined)[]): string {
  return parts.filter((part) => part !== undefined).join(", ");
}

function describeCursor(current: SelectionCursor): CursorLayers {
  const beat = current.beat;
  const voiceBar = beat.voiceBar;
  const bar = voiceBar.bar;
  const staff = bar.staff;
  const masterBar = bar.masterBar;
  return {
    track: `Track ${formatTrackName(staff.track)}`,
    staff: formatStaff(staff),
    voice: formatVoice(voiceBar),
    voiceNumber: voiceBar.voiceNumber,
    bar:
      `Bar ${staff.bars.indexOf(bar) + 1},` +
      ` ${masterBar.beatsCount}/${1 / masterBar.duration},` +
      ` ${masterBar.tempo} BPM${formatRepeats(beat)}`,
    beat:
      `Beat ${voiceBar.beats.indexOf(beat) + 1},` +
      ` ${formatRhythm(beat)}${formatDynamicChange(beat)}` +
      `${formatBeatTechniques(beat)}`,
    slot: formatNoteSlot(current),
  };
}

/** Captures the spoken bar, beat, and slot text of the cursor, if any. */
export function captureSelectionText(
  source: NotationSelectionSource
): NotationSelectionText | undefined {
  const cursor = source.selectionCursor;
  if (cursor === undefined || cursor.beat === undefined) {
    return undefined;
  }
  const { bar, beat, slot } = describeCursor(cursor);
  return { bar, beat, slot };
}

/**
 * Formats full context, or only the layers that changed since `previous`.
 * When the cursor stayed in place, `previousText` tells whether an edit
 * changed the bar, the beat, or the note slot. If none of them changed, for
 * example after a track rename, it returns undefined. Without
 * `previousText`, only the note slot is read.
 */
export function formatNotationSelection(
  source: NotationSelectionSource,
  previous?: NotationCursorPosition,
  previousText?: NotationSelectionText
): string | undefined {
  const current = source.selectionCursor;
  if (current === undefined) {
    const beats = source.selectionAsBeats;
    const activeEnd = source.selectionEndBeat;
    if (beats.length === 0 || activeEnd === undefined) {
      return undefined;
    }

    const start = beats[0];
    const end = beats[beats.length - 1];
    const anchor = activeEnd === start ? end : start;
    const voiceBar = start.voiceBar;
    const staff = voiceBar.bar.staff;
    const selected = `${beats.length} beat${beats.length === 1 ? "" : "s"} selected`;
    return (
      joinParts([
        formatStaff(staff),
        formatVoice(voiceBar),
        selected,
        `${formatRangeEndpoint(start)} to ${formatRangeEndpoint(end)}`,
        `anchor ${formatRangeEndpoint(anchor)}`,
        `active end ${formatRangeEndpoint(activeEnd)}`,
      ]) + "."
    );
  }

  const layers = describeCursor(current);
  const { bar, beat, slot } = layers;
  const staff = current.beat.voiceBar.bar.staff;
  const track = staff.track;

  if (previous?.trackUuid !== track.uuid) {
    return joinParts([
      layers.track,
      layers.staff,
      layers.voice,
      bar,
      beat,
      slot,
    ]);
  }
  if (previous.staffUuid !== staff.uuid) {
    // Moving between staves means the track has more than one.
    return joinParts([layers.staff, layers.voice, bar, beat, slot]);
  }
  const voice =
    layers.voice === undefined ? undefined : capitalize(layers.voice);
  if (previous.barUuid !== current.beat.voiceBar.bar.uuid) {
    return joinParts([bar, voice, beat, slot]);
  }
  if (previous.voiceNumber !== layers.voiceNumber) {
    // Always name the voice the cursor moved to.
    return joinParts([`Voice ${layers.voiceNumber}`, beat, slot]);
  }
  if (previous.beatUuid !== current.beat.uuid) {
    return joinParts([beat, slot]);
  }
  if (previousText === undefined) {
    return slot;
  }
  if (previousText.bar !== bar) {
    return joinParts([bar, beat, slot]);
  }
  if (previousText.beat !== beat) {
    return joinParts([beat, slot]);
  }
  return previousText.slot === slot ? undefined : slot;
}

/** Describes the score and track for a full recap. */
function formatScoreAndTrack(track: Track): string[] {
  const score = track.score;
  const title = score.name.trim();
  const artist = score.artist.trim();
  const parts: string[] = [];
  if (title !== "" && artist !== "") {
    parts.push(`${title} by ${artist}.`);
  } else if (title !== "" || artist !== "") {
    parts.push(`${title}${artist}.`);
  }
  const index = score.tracks.indexOf(track);
  parts.push(
    `Track ${formatTrackName(track)}, ${index + 1} of ${score.tracks.length}.`
  );
  return parts;
}

/** Names the staff and voice, always, with the staff count. */
function formatStaffAndVoice(voiceBar: VoiceBar): string {
  const staff = voiceBar.bar.staff;
  const staves = staff.track.staves;
  return (
    `Staff ${staves.indexOf(staff) + 1} of ${staves.length},` +
    ` voice ${voiceBar.voiceNumber}.`
  );
}

/**
 * Describes everything about the current selection, for a "where am I"
 * shortcut: the score title and artist, the track, staff, and voice, then the
 * cursor's bar, beat, and note, or the selected range. Unlike navigation
 * announcements, it always names the staff, voice, and current dynamic.
 */
export function formatSelectionRecap(
  source: NotationSelectionSource
): string | undefined {
  const cursor = source.selectionCursor;
  if (cursor === undefined) {
    const beats = source.selectionAsBeats;
    const activeEnd = source.selectionEndBeat;
    if (beats.length === 0 || activeEnd === undefined) {
      return undefined;
    }
    const start = beats[0];
    const end = beats[beats.length - 1];
    const voiceBar = start.voiceBar;
    return [
      ...formatScoreAndTrack(voiceBar.bar.staff.track),
      formatStaffAndVoice(voiceBar),
      `${beats.length} beat${beats.length === 1 ? "" : "s"} selected,` +
        ` ${formatRangeEndpoint(start)} to ${formatRangeEndpoint(end)},` +
        ` active end ${formatRangeEndpoint(activeEnd)}.`,
    ].join(" ");
  }

  const beat = cursor.beat;
  const voiceBar = beat.voiceBar;
  const bar = voiceBar.bar;
  const staff = bar.staff;
  const masterBar = bar.masterBar;
  const beatIndex = voiceBar.beats.indexOf(beat);
  const dynamic = DYNAMIC_NAMES[beat.dynamic].toLowerCase();
  return [
    ...formatScoreAndTrack(staff.track),
    formatStaffAndVoice(voiceBar),
    `Bar ${staff.bars.indexOf(bar) + 1} of ${staff.bars.length},` +
      ` ${masterBar.beatsCount}/${1 / masterBar.duration},` +
      ` ${masterBar.tempo} BPM${formatRepeats(beat)}.`,
    `Beat ${beatIndex + 1} of ${voiceBar.beats.length},` +
      ` ${formatRhythm(beat)}, ${dynamic}${formatBeatTechniques(beat)}.`,
    formatNoteSlot(cursor),
  ].join(" ");
}
