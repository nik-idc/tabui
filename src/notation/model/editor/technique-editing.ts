import type { BendTechniqueOptions } from "../bend-options";
import { Beat } from "../beat";
import { GuitarNote } from "../guitar-note";
import { MusicInstrument } from "../instrument/instrument";
import { Note } from "../note";
import { GuitarTechniqueType, TechniqueType } from "../technique-type";
import { EditPosition } from "./edit-position";
import type { BeatPosition, NotePosition } from "./edit-position";
import { LetRingEditing } from "./let-ring-editing";
import { TechniqueEditKind } from "./technique-edit-plan";
import type { TechniqueEditPlan } from "./technique-edit-plan";
import { TieEditing } from "./tie-editing";

/** Internal shared technique rules behind the ScoreEditor facade. */
export class TechniqueEditing {
  /**
   * Removes the technique if every eligible selected guitar slot has it and no bend options are supplied.
   * Otherwise, attempts to apply or update it on each guitar note.
   * Tie uses backward search on the selected note strings and can fill intervening empty slots.
   * @param notes Live selected notes; non-guitar notes are skipped. Ordinary techniques use note-level applicability rules.
   * @param type Technique to toggle.
   * @param bendOptions Required when adding a bend; supplying options updates existing bends.
   * @returns True if any note changed.
   * @throws If bend options are missing when required or invalid for the technique. Transition lookup can also throw if a note's beat is a rest.
   */
  public static setTechniqueForNotes<I extends MusicInstrument>(
    notes: Note<I>[],
    type: TechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ): boolean {
    if (type === GuitarTechniqueType.Tie) {
      return TieEditing.setTieNotes(notes).length > 0;
    }

    return this.applyTechniquePlan(
      this.buildOrdinaryTechniquePlan(notes, type, bendOptions)
    );
  }

  /** Resolves selected live slots; rests contribute no notes for ordinary techniques. */
  public static getTechniqueNotes(
    targets: (BeatPosition | NotePosition)[]
  ): Note[] {
    return targets.flatMap((p) => {
      const beat = EditPosition.resolveBeatPosition(p);
      const stringNumber = "stringNumber" in p ? p.stringNumber : undefined;
      return (beat.notes ?? []).filter(
        (_, i) => stringNumber === undefined || i === stringNumber - 1
      );
    });
  }

  /** Builds a technique plan without changing content, so commands can save its affected beats first. */
  public static buildTechniquePlan(
    targets: (BeatPosition | NotePosition)[],
    type: TechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ): TechniqueEditPlan {
    if (type === GuitarTechniqueType.Tie) {
      const tie = TieEditing.buildTiePlan(targets);
      return {
        stateBeats: tie.stateBeats,
        affectedTargets: tie.affectedBeats.map((b) =>
          EditPosition.getBeatPosition(b)
        ),
        operation: tie,
      };
    }

    return this.buildOrdinaryTechniquePlan(
      this.getTechniqueNotes(targets),
      type,
      bendOptions
    );
  }

  /** Applies fixed prepared operations; history redo should restore saved content instead. */
  public static applyTechniquePlan(plan: TechniqueEditPlan): boolean {
    if (plan.operation.kind === TechniqueEditKind.Tie) {
      return TieEditing.applyTiePlan(plan.operation).length > 0;
    }

    const { notes, type, bendOptions, removeTechnique } = plan.operation;
    let changesMade = false;
    for (const note of notes) {
      if (removeTechnique && !note.hasTechnique(type)) {
        continue;
      }

      if (!removeTechnique && bendOptions === null && note.hasTechnique(type)) {
        continue;
      }

      if (!note.hasTechnique(type) && !this.isTechniqueApplicable(note, type)) {
        continue;
      }

      if (note.setTechnique(type, bendOptions)) {
        changesMade = true;
      }
    }

    LetRingEditing.normalizeNoteContent(plan.stateBeats);
    return changesMade;
  }

  /** Checks eligibility for selected slots; applied techniques remain removable. */
  public static canSetTechnique(
    beats: Beat[],
    type: TechniqueType,
    stringNumber?: number
  ): boolean {
    if (type === GuitarTechniqueType.Bend && stringNumber === undefined) {
      return false;
    }
    if (type === GuitarTechniqueType.Tie) {
      return TieEditing.canSetTie(beats, stringNumber);
    }
    return beats.some((b) =>
      (b.notes ?? []).some(
        (n, i) =>
          (stringNumber === undefined || i === stringNumber - 1) &&
          (n.hasTechnique(type) || this.isTechniqueApplicable(n, type))
      )
    );
  }

  /** Fixes ordinary toggle decisions and snapshot targets before any content changes. */
  private static buildOrdinaryTechniquePlan(
    notes: Note[],
    type: TechniqueType,
    bendOptions: BendTechniqueOptions | null
  ): TechniqueEditPlan {
    const staves = [...new Set(notes.map((n) => n.beat.voiceBar.bar.staff))];
    const guitarNotes = notes
      .filter((n) => n instanceof GuitarNote)
      .sort((a, b) => {
        const staff = a.beat.voiceBar.bar.staff;
        const otherStaff = b.beat.voiceBar.bar.staff;
        if (staff !== otherStaff) {
          return staves.indexOf(staff) - staves.indexOf(otherStaff);
        }
        const barOrder =
          staff.bars.indexOf(a.beat.voiceBar.bar) -
          staff.bars.indexOf(b.beat.voiceBar.bar);
        return (
          barOrder ||
          a.beat.voiceBar.beats.indexOf(a.beat) -
            b.beat.voiceBar.beats.indexOf(b.beat)
        );
      });
    const applicableNotes = guitarNotes.filter(
      (n) => n.hasTechnique(type) || this.isTechniqueApplicable(n, type)
    );
    const hasAllWithTechnique =
      applicableNotes.length > 0 &&
      applicableNotes.every((n) => n.hasTechnique(type));
    const removeTechnique = hasAllWithTechnique && bendOptions === null;
    const affectedNotes = guitarNotes;
    const selectedBeats: Beat[] = [
      ...new Set(affectedNotes.map((n) => n.beat)),
    ];
    const affectedBeats =
      type === GuitarTechniqueType.LetRing
        ? LetRingEditing.getNoteEditBeats(selectedBeats)
        : selectedBeats;
    const stateBeats = affectedBeats.filter(
      (b) => selectedBeats.includes(b) || LetRingEditing.hasEmptyMarker(b)
    );
    return {
      stateBeats,
      affectedTargets: [
        ...EditPosition.getTechniqueTargetsForNotes(affectedNotes),
        ...affectedBeats
          .filter((b) => !selectedBeats.includes(b))
          .map((b) => EditPosition.getBeatPosition(b)),
      ],
      operation: {
        kind: TechniqueEditKind.Ordinary,
        notes: guitarNotes,
        type,
        bendOptions,
        removeTechnique,
      },
    };
  }

  /** Combines local technique restrictions with editor-owned empty-slot support checks. */
  private static isTechniqueApplicable(
    note: Note,
    type: TechniqueType
  ): boolean {
    if (type === GuitarTechniqueType.LetRing) {
      return LetRingEditing.isApplicable(note);
    }
    return note.isTechniqueApplicable(type);
  }
}
