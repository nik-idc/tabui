import { MusicInstrument } from "./instrument/instrument";

export interface TrackContext<I extends MusicInstrument = MusicInstrument> {
  instrument: I;
}
