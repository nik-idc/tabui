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

/** Immutable model context for one selected notation slot. */
export interface NotationSelectionSnapshot {
  readonly beat: Beat;
  readonly noteIndex: number;
  readonly trackIndex: number;
  readonly staffIndex: number;
  readonly barIndex: number;
  readonly voiceNumber: number;
  readonly beatIndex: number;
  readonly trackUuid: number;
  readonly staffUuid: number;
  readonly barUuid: number;
  readonly beatUuid: number;
}

/** Captures model ownership and indexes before navigation mutates them. */
export function captureSelectionCursor(
  cursor: SelectionCursor | undefined
): NotationSelectionSnapshot | undefined {
  if (cursor === undefined || cursor.beat === undefined) return undefined;
  const beat = cursor.beat;
  const voiceBar = beat.voiceBar;
  const bar = voiceBar.bar;
  const staff = bar.staff;
  const track = staff.track;
  const score = track.score;
  return {
    beat,
    noteIndex: cursor.noteIndex,
    trackIndex: score.tracks.indexOf(track),
    staffIndex: track.staves.indexOf(staff),
    barIndex: staff.bars.indexOf(bar),
    voiceNumber: voiceBar.voiceNumber,
    beatIndex: voiceBar.beats.indexOf(beat),
    trackUuid: track.uuid,
    staffUuid: staff.uuid,
    barUuid: bar.uuid,
    beatUuid: beat.uuid,
  };
}

/** Reports whether two snapshots identify the same model slot. */
export function notationSelectionsEqual(
  first: NotationSelectionSnapshot | undefined,
  second: NotationSelectionSnapshot | undefined
): boolean {
  return (
    first?.staffUuid === second?.staffUuid &&
    first?.barUuid === second?.barUuid &&
    first?.voiceNumber === second?.voiceNumber &&
    first?.beatUuid === second?.beatUuid &&
    first?.noteIndex === second?.noteIndex
  );
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
function formatSlot(selection: NotationSelectionSnapshot): string {
  const beat = selection.beat;
  const prefix = `${beat.trackContext.instrument instanceof Guitar ? "String" : "Lane"} ${selection.noteIndex + 1}`;
  if (beat.isRest()) return `${prefix}, rest.`;
  const note = beat.notes?.[selection.noteIndex] ?? null;
  if (note === null || note.noteValue === NoteValue.None)
    return `${prefix}, empty.`;
  if (note.noteValue === NoteValue.Dead) return `${prefix}, dead note.`;
  return note instanceof GuitarNote
    ? `${prefix}, fret ${note.fret}${formatTechniques(note)}.`
    : `${prefix}.`;
}

/** Formats full context or the smallest changed navigation layer. */
export function formatNotationSelection(
  current: NotationSelectionSnapshot,
  previous?: NotationSelectionSnapshot
): string {
  const beat = current.beat;
  const bar = beat.voiceBar.bar;
  const masterBar = bar.masterBar;
  const beatText = `Beat ${current.beatIndex + 1}, ${formatRhythm(beat)}. ${formatSlot(current)}`;
  const voiceText = `Voice ${current.voiceNumber}. ${beatText}`;
  const barText = `Bar ${current.barIndex + 1}, ${masterBar.beatsCount}/${1 / masterBar.duration}, ${masterBar.tempo} BPM${formatRepeats(beat)}. ${voiceText}`;
  const staffText = `Staff ${current.staffIndex + 1}, voice ${current.voiceNumber}. Bar ${current.barIndex + 1}, ${masterBar.beatsCount}/${1 / masterBar.duration}, ${masterBar.tempo} BPM${formatRepeats(beat)}. ${beatText}`;
  if (previous === undefined || previous.trackUuid !== current.trackUuid) {
    const name =
      bar.staff.track.name.trim() === ""
        ? `${current.trackIndex + 1}`
        : bar.staff.track.name;
    return `Track ${name}. ${staffText}`;
  }
  if (previous.staffUuid !== current.staffUuid) return staffText;
  if (previous.barUuid !== current.barUuid) return barText;
  if (previous.voiceNumber !== current.voiceNumber) return voiceText;
  if (previous.beatUuid !== current.beatUuid) return beatText;
  return formatSlot(current);
}

function formatRepeats(beat: Beat): string {
  const bar = beat.voiceBar.bar.masterBar;
  if (!bar.isRepeatStart && !bar.isRepeatEnd) return "";
  if (bar.isRepeatStart && bar.isRepeatEnd) {
    return `, repeat start, repeat end ${bar.repeatCount} ${bar.repeatCount === 1 ? "time" : "times"}`;
  }
  return bar.isRepeatStart
    ? ", repeat start"
    : `, repeat end ${bar.repeatCount} ${bar.repeatCount === 1 ? "time" : "times"}`;
}
