import { MusicInstrument } from "./instrument/instrument";

/** Shared track data used by its staves, bars, beats, and notes. */
export interface TrackContext<I extends MusicInstrument = MusicInstrument> {
  /** Current instrument; replacement affects all models sharing this context. */
  instrument: I;
}
