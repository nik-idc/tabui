import {
  Beat,
  BendType,
  DURATION_TO_DESC,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteValue,
} from "../model";
import { SelectionCursor } from "../controller";

interface NotationSelectionSource {
  readonly selectionCursor: SelectionCursor | undefined;
  readonly selectionAsBeats: Beat[];
  readonly selectionEndBeat: Beat | undefined;
}

const TECHNIQUE_NAMES: Record<GuitarTechniqueType, string> = {
  [GuitarTechniqueType.Bend]: "bend",
  [GuitarTechniqueType.Legato]: "legato",
  [GuitarTechniqueType.LetRing]: "let ring",
  [GuitarTechniqueType.NaturalHarmonic]: "natural harmonic",
  [GuitarTechniqueType.PalmMute]: "palm mute",
  [GuitarTechniqueType.PinchHarmonic]: "pinch harmonic",
  [GuitarTechniqueType.Slide]: "slide",
  [GuitarTechniqueType.Vibrato]: "vibrato",
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
  if (note.techniques.length === 0) return "";
  const names = note.techniques.map((technique) => {
    const name = TECHNIQUE_NAMES[technique.type];
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
  if (beat.isRest()) return `${prefix}, rest.`;
  const note = beat.notes?.[selection.noteIndex] ?? null;
  if (note === null || note.noteValue === NoteValue.None)
    return `${prefix}, empty.`;
  if (note.noteValue === NoteValue.Dead) return `${prefix}, dead note.`;
  return note instanceof GuitarNote
    ? `${prefix}, fret ${note.fret}${formatTechniques(note)}.`
    : `${prefix}.`;
}

function formatRepeats(beat: Beat): string {
  const bar = beat.voiceBar.bar.masterBar;
  if (!bar.isRepeatStart && !bar.isRepeatEnd) return "";
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

/** Formats full context or the smallest changed navigation layer. */
export function formatNotationSelection(
  source: NotationSelectionSource,
  previous?: NotationCursorPosition
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
    const track = staff.track;
    const name =
      track.name.trim() === ""
        ? `${track.score.tracks.indexOf(track) + 1}`
        : track.name;
    return (
      `Track ${name}, Staff ${track.staves.indexOf(staff) + 1},` +
      ` voice ${voiceBar.voiceNumber},` +
      ` ${beats.length} beat${beats.length === 1 ? "" : "s"} selected,` +
      ` ${formatRangeEndpoint(start)} to ${formatRangeEndpoint(end)},` +
      ` anchor ${formatRangeEndpoint(anchor)},` +
      ` active end ${formatRangeEndpoint(activeEnd)}.`
    );
  }

  const beat = current.beat;
  const voiceBar = beat.voiceBar;
  const bar = voiceBar.bar;
  const staff = bar.staff;
  const track = staff.track;
  const barIndex = staff.bars.indexOf(bar);
  const voiceNumber = voiceBar.voiceNumber;
  const masterBar = bar.masterBar;
  const beatText =
    `Beat ${voiceBar.beats.indexOf(beat) + 1},` +
    ` ${formatRhythm(beat)}, ${formatNoteSlot(current)}`;
  const voiceText = `Voice ${voiceNumber}, ${beatText}`;
  const barPrefix =
    `Bar ${barIndex + 1}, ${masterBar.beatsCount}/${1 / masterBar.duration},` +
    ` ${masterBar.tempo} BPM${formatRepeats(beat)}`;
  const barText = `${barPrefix}, ${voiceText}`;
  const staffText =
    `Staff ${track.staves.indexOf(staff) + 1}, voice ${voiceNumber}, ` +
    `${barPrefix}, ${beatText}`;

  if (previous?.trackUuid !== track.uuid) {
    const name =
      track.name.trim() === ""
        ? `${track.score.tracks.indexOf(track) + 1}`
        : track.name;
    return `Track ${name}, ${staffText}`;
  }
  if (previous.staffUuid !== staff.uuid) {
    return staffText;
  }
  if (previous.barUuid !== bar.uuid) {
    return barText;
  }
  if (previous.voiceNumber !== voiceNumber) {
    return voiceText;
  }
  if (previous.beatUuid !== beat.uuid) {
    return beatText;
  }

  return formatNoteSlot(current);
}
