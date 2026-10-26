import { Beat } from "../beat";
import { GuitarNote } from "../guitar-note";
import { GuitarTechnique } from "../guitar-technique";
import { Note } from "../note";
import { GuitarTechniqueType } from "../technique-type";
import { EditPosition } from "./edit-position";
import type { BeatPosition, NotePosition } from "./edit-position";
import { LetRingEditing } from "./let-ring-editing";
import { TechniqueEditKind } from "./technique-edit-plan";
import type { TieChain, TieEditPlan } from "./technique-edit-plan";

/** Fret values used by the search: `null` for empty guitar slots and `undefined` for slots that are not guitar notes. */
type TieFrets = (number | null | undefined)[];

/** Internal backward tie search and fixed-plan application for ScoreEditor. */
export class TieEditing {
  /**
   * Joins notes to the previous beat, or removes ties when all selected playable notes have them.
   * @param beats Live selected beats, processed in input order; rests can become continuations, but stop backward searches.
   * @param stringNumber One-based string to edit; omitted copies whole chords, searching each string independently.
   * @param searchToEarliest Search through empty slots and matching frets instead of only the previous beat.
   * @returns Unique affected beats, including predecessors for tie display; empty if no playable source or tie to remove exists.
   */
  public static setTieBeats(
    beats: Beat[],
    stringNumber?: number,
    searchToEarliest = false
  ): Beat[] {
    return this.applyTiePlan(
      this.buildTiePlanForBeats(beats, stringNumber, searchToEarliest)
    );
  }

  /** Ties explicit slots to the previous beat or earliest source, preserving other strings. */
  public static setTieNotes(notes: Note[], searchToEarliest = false): Beat[] {
    return this.applyTiePlan(
      this.buildTiePlanForNotes(notes, searchToEarliest)
    );
  }

  /** Plans previous-beat or earliest-source ties; whole-beat targets replace chords, string targets preserve other strings. */
  public static buildTiePlan(
    targets: (BeatPosition | NotePosition)[],
    searchToEarliest = false
  ): TieEditPlan {
    const resolved = targets.map((p) => ({
      beat: EditPosition.resolveBeatPosition(p),
      stringNumber: "stringNumber" in p ? p.stringNumber : undefined,
    }));
    const playable = resolved.flatMap(({ beat, stringNumber }) =>
      (beat.notes ?? []).filter(
        (n) =>
          n instanceof GuitarNote &&
          n.fret !== null &&
          (stringNumber === undefined || n.stringNum === stringNumber)
      )
    );
    const shouldRemove =
      playable.length > 0 &&
      playable.every((n) => n.hasTechnique(GuitarTechniqueType.Tie));
    const plan: TieEditPlan = {
      kind: TechniqueEditKind.Tie,
      edits: [],
      removals: [],
      stateBeats: [],
      affectedBeats: [],
    };
    const plannedFrets = new Map<Beat, TieFrets>();
    const stateBeats = new Set<Beat>();
    for (const { beat, stringNumber } of resolved) {
      if (shouldRemove) {
        for (const note of beat.notes ?? []) {
          const matches =
            note instanceof GuitarNote &&
            (stringNumber === undefined || note.stringNum === stringNumber) &&
            note.hasTechnique(GuitarTechniqueType.Tie);
          if (matches) {
            plan.removals.push({ beat, stringNumber: note.stringNum });
            stateBeats.add(beat);
          }
        }
        continue;
      }

      const chains = this.findTieChains(
        beat,
        stringNumber,
        plannedFrets,
        searchToEarliest
      );
      if (chains.length === 0) {
        continue;
      }

      for (const stateBeat of this.getTieChainStateBeats(beat, chains)) {
        stateBeats.add(stateBeat);
      }
      const replaceBeat = stringNumber === undefined;
      plan.edits.push({ beat, replaceBeat, chains });
      if (replaceBeat) {
        plannedFrets.set(
          beat,
          Array(beat.trackContext.instrument.maxPolyphony).fill(null)
        );
      }
      for (const { source, beats } of chains) {
        for (const target of beats) {
          const frets =
            plannedFrets.get(target) ??
            this.getTieFrets(target) ??
            Array(target.trackContext.instrument.maxPolyphony).fill(null);
          frets[source.stringNumber - 1] = source.fret;
          plannedFrets.set(target, frets);
        }
      }
    }

    const affectedBeats = new Set(
      LetRingEditing.getNoteEditBeats([...stateBeats])
    );
    for (const beat of stateBeats) {
      const previous = beat.voiceBar.bar.staff.getPrevBeat(beat);
      if (previous !== null) {
        affectedBeats.add(previous);
      }
    }
    plan.affectedBeats = [...affectedBeats];
    plan.stateBeats = LetRingEditing.getNoteEditBeats([...stateBeats]);
    return plan;
  }

  /** Plans beat/chord ties using the requested search mode; earlier targets inform later searches. */
  public static buildTiePlanForBeats(
    beats: Beat[],
    stringNumber?: number,
    searchToEarliest = false
  ): TieEditPlan {
    return this.buildTiePlan(
      beats.map((b) =>
        stringNumber === undefined
          ? EditPosition.getBeatPosition(b)
          : { ...EditPosition.getBeatPosition(b), stringNumber }
      ),
      searchToEarliest
    );
  }

  /** Plans note-slot ties using the requested search mode, preserving other strings. */
  public static buildTiePlanForNotes(
    notes: Note[],
    searchToEarliest = false
  ): TieEditPlan {
    const guitarNotes = notes.filter((n) => n instanceof GuitarNote);
    return this.buildTiePlan(
      EditPosition.getTechniqueTargetsForNotes(guitarNotes),
      searchToEarliest
    );
  }

  /** Applies a prepared plan without searching again; save affected beats before this model boundary. */
  public static applyTiePlan(plan: TieEditPlan): Beat[] {
    for (const { beat, stringNumber } of plan.removals) {
      beat.notes?.[stringNumber - 1]?.removeTechnique(GuitarTechniqueType.Tie);
    }
    for (const { beat, chains, replaceBeat } of plan.edits) {
      this.applyTieChains(beat, chains, replaceBeat);
    }
    for (const beat of plan.stateBeats) {
      for (const note of beat.notes ?? []) {
        if (note instanceof GuitarNote && !note.isTieContinuation) {
          note.removeTechnique(GuitarTechniqueType.Tie);
        }
      }
    }
    LetRingEditing.normalizeNoteContent(plan.stateBeats);
    return plan.affectedBeats;
  }

  /** Checks whether selected ties can be removed or a backward source can be found. */
  public static canSetTie(
    beats: Beat[],
    stringNumber?: number,
    searchToEarliest = false
  ): boolean {
    return (
      this.shouldRemoveSelectedTies(beats, stringNumber) ||
      beats.some(
        (b) =>
          this.findTieChains(b, stringNumber, undefined, searchToEarliest)
            .length > 0
      )
    );
  }

  /** Finds a previous-beat source or the earliest matching source, in playback order. */
  private static findTieChain(
    beat: Beat,
    stringNumber: number,
    plannedFrets: Map<Beat, TieFrets> = new Map(),
    searchToEarliest = false
  ): TieChain | null {
    const staff = beat.voiceBar.bar.staff;
    const chain = [beat];
    let source: TieChain["source"] | null = null;
    let previous = staff.getPrevBeat(beat);
    // Staff traversal keeps the voice and stops at absent or empty adjacent voices.
    while (previous !== null) {
      const frets = plannedFrets.get(previous) ?? this.getTieFrets(previous);
      const fret = frets?.[stringNumber - 1];
      if (fret === undefined) {
        break;
      }
      if (fret !== null) {
        // The nearest playable source fixes the fret; dead or different frets stop us.
        const matchesSource =
          source === null ? fret >= 0 : fret === source.fret;
        if (!matchesSource) {
          break;
        }
        source = { beat: previous, stringNumber, fret };
      }
      chain.push(previous);
      if (!searchToEarliest) {
        break;
      }
      previous = staff.getPrevBeat(previous);
    }
    if (source === null) {
      return null;
    }

    // Ignore the selected fret; blanks before the earliest source stay empty.
    const sourceIndex = chain.indexOf(source.beat);
    return { source, beats: chain.slice(0, sourceIndex).reverse() };
  }

  /** Plans each string independently before any chord content is replaced. */
  private static findTieChains(
    beat: Beat,
    stringNumber?: number,
    plannedFrets: Map<Beat, TieFrets> = new Map(),
    searchToEarliest = false
  ): TieChain[] {
    const strings =
      stringNumber === undefined
        ? Array.from(
            { length: beat.trackContext.instrument.maxPolyphony },
            (_, i) => i + 1
          )
        : [stringNumber];
    const chains: TieChain[] = [];
    for (const string of strings) {
      const chain = this.findTieChain(
        beat,
        string,
        plannedFrets,
        searchToEarliest
      );
      if (chain !== null) {
        chains.push(chain);
      }
    }
    return chains;
  }

  /** Returns true when every selected non-empty guitar slot already has a tie. */
  private static shouldRemoveSelectedTies(
    beats: Beat[],
    stringNumber?: number
  ): boolean {
    const notes = beats
      .flatMap((b) => b.notes ?? [])
      .filter(
        (n) =>
          n instanceof GuitarNote &&
          n.fret !== null &&
          (stringNumber === undefined || n.stringNum === stringNumber)
      );

    return (
      notes.length > 0 &&
      notes.every((n) => n.hasTechnique(GuitarTechniqueType.Tie))
    );
  }

  /** Reads search data without copying or changing live notes. */
  private static getTieFrets(beat: Beat): TieFrets | null {
    return (
      beat.notes?.map((n) => (n instanceof GuitarNote ? n.fret : undefined)) ??
      null
    );
  }

  /** Lists snapshot candidates, including next beats whose ties can be invalidated. */
  private static getTieChainStateBeats(beat: Beat, chains: TieChain[]): Beat[] {
    const stateBeats = [beat];
    const staff = beat.voiceBar.bar.staff;
    for (const { source, beats: targets } of chains) {
      stateBeats.push(source.beat);
      for (const target of targets) {
        stateBeats.push(target);
        const next = staff.getNextBeat(target);
        if (next !== null) {
          stateBeats.push(next);
        }
      }
    }
    return stateBeats;
  }

  /** Installs copied continuations in playback order after all candidates are saved. */
  private static applyTieChains(
    beat: Beat,
    chains: TieChain[],
    replaceBeat: boolean
  ): void {
    if (replaceBeat) {
      beat.makeRest();
    }

    for (const { source, beats: targets } of chains) {
      for (const target of targets) {
        target.makeBeatWithNotes();
        const existingNote = target.notes?.[source.stringNumber - 1];
        if (existingNote instanceof GuitarNote) {
          // Replace the slot so transient frets do not invalidate a later planned tie.
          const continuation = existingNote.deepCopy();
          continuation.clearTechniques();
          continuation.setFret(source.fret);
          continuation.addTechnique(
            new GuitarTechnique(continuation, GuitarTechniqueType.Tie)
          );
          target.setNote(source.stringNumber - 1, continuation);
        }
      }
    }
  }
}
