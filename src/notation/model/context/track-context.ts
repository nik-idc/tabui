import { Guitar } from "../instrument/guitar/guitar";
import { MusicInstrument } from "../instrument/instrument";

export interface TrackContext<I extends MusicInstrument = MusicInstrument> {
  instrument: I;
}

export type TabContext = TrackContext<Guitar>;
