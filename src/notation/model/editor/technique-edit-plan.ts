import type { BendTechniqueOptions } from "../bend-options";
import type { Beat } from "../beat";
import type { GuitarNote } from "../guitar-note";
import type { TechniqueType } from "../technique-type";
import type { BeatPosition, NotePosition } from "./edit-position";

/** Fixed source and continuations for one string's planned tie edit. */
export type TieChain = {
  /** Fixed source position and fret, so applying a plan does not search again. */
  source: {
    /** Beat that supplies the attack. */
    beat: Beat;
    /** One-based source string. */
    stringNumber: number;
    /** Fret copied into the continuations. */
    fret: number;
  };
  /** Continuation beats in playback order. */
  beats: Beat[];
};

/** Distinguishes fixed tie edits from ordinary technique toggles. */
export enum TechniqueEditKind {
  Tie = "tie",
  Ordinary = "ordinary",
}

/** Fixed tie edits in input order, plus all beats to save before applying them. */
export type TieEditPlan = {
  /** Identifies the operation when used in a technique plan. */
  kind: TechniqueEditKind.Tie;
  /** Planned continuations, kept in target order for overlapping edits. */
  edits: {
    /** Selected destination beat. */
    beat: Beat;
    /** Clear the entire selected beat before installing its planned continuations. */
    replaceBeat: boolean;
    /** Per-string sources and continuations resolved before mutation. */
    chains: TieChain[];
  }[];
  /** Fixed string positions whose ties will be removed without changing frets. */
  removals: {
    /** Beat holding the continuation. */
    beat: Beat;
    /** One-based continuation string. */
    stringNumber: number;
  }[];
  /** Source, target, and next beats whose incoming ties need validation after all edits. */
  stateBeats: Beat[];
  /** Includes sources, changed beats, next-beat invalidations, and display predecessors; empty for a no-op. */
  affectedBeats: Beat[];
};

/** Fixed note toggles, with the removal decision made before any note changes. */
export type OrdinaryTechniquePlan = {
  /** Identifies the operation when used in a technique plan. */
  kind: TechniqueEditKind.Ordinary;
  /** Live guitar slots to edit after history has saved their beats. */
  notes: GuitarNote[];
  /** Requested technique to toggle or update. */
  type: TechniqueType;
  /** Supplied bend settings; null keeps the toggle behavior across target notes. */
  bendOptions: BendTechniqueOptions | null;
  /** Remove the technique from target notes instead of adding it. */
  removeTechnique: boolean;
};

/** Prepared technique edit and the beat content that history must save before applying it. */
export type TechniqueEditPlan = {
  /** Beats whose content can change, excluding display-only anchors. */
  stateBeats: Beat[];
  /** Fixed display anchors; a string identifies a note, while omission identifies its beat. */
  affectedTargets: (BeatPosition | NotePosition)[];
  /** Fixed tie operation or ordinary note toggles, resolved at the model boundary. */
  operation: TieEditPlan | OrdinaryTechniquePlan;
};
