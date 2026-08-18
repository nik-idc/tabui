import { SelectionCursorSnapshot } from "./notation/controller/selection";
import { Beat, Track, VoiceNumber } from "./notation/model";
import { PlaybackErrorCode, PlaybackState } from "./player";

/** Stable host-observable editor state captured at a change boundary. */
export interface TabUIEditorStateSnapshot {
  /** Track currently displayed by the notation view. */
  readonly activeTrack: Track;
  /** Score-wide playback state. */
  readonly playback: {
    /** Current score transport state. */
    readonly state: PlaybackState;
    /** Whether playback loop mode is enabled. */
    readonly isLooped: boolean;
  };
  /** Current model-level editing selection. */
  readonly selection: {
    /** Voice currently targeted by editing operations. */
    readonly activeVoiceNumber: VoiceNumber;
    /** Selected beat range, empty when a note cursor is selected. */
    readonly beats: readonly Beat[];
    /** Current note cursor, or null when a beat range is selected. */
    readonly cursor: SelectionCursorSnapshot | null;
  };
  /** Current rendered notation dimensions in CSS pixels. */
  readonly layout: {
    /** Notation content width, excluding horizontal padding. */
    readonly width: number;
    /** Calculated height of the active track. */
    readonly height: number;
  };
}

/** Actionable asynchronous failure projected to the owning host. */
export interface TabUIEditorError {
  /** Subsystem that produced the failure. */
  readonly source: "playback";
  /** Stable machine-readable playback failure code. */
  readonly code: PlaybackErrorCode;
  /** Human-readable failure summary. */
  readonly message: string;
  /** Original thrown value for logging and diagnostics. */
  readonly cause: unknown;
}

/** Public notification emitted by one editor instance. */
export type TabUIEditorEvent =
  | { readonly type: "change"; readonly state: TabUIEditorStateSnapshot }
  | { readonly type: "error"; readonly error: TabUIEditorError };

/** Listener for host-observable events from one editor instance. */
export type TabUIEditorListener = (event: TabUIEditorEvent) => void;
