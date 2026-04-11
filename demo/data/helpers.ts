import {
  Track,
  Bar,
  Beat,
  NoteDuration,
  Guitar,
  Score,
  GuitarNote,
  Staff,
  MusicInstrument,
  TrackContext,
} from "@/notation/model";

type BarsInfo = {
  beatsCount: number;
  beatsDuration: NoteDuration;
};

const excludedStrings = [1, 5, 6];

export function fillBar(bar: Bar<Guitar>, barsInfo: BarsInfo): void {
  for (let i = 0; i < barsInfo.beatsCount; i++) {
    const reusedSeedBeat = i === 0 && bar.isEmpty();
    const newBeat = reusedSeedBeat
      ? bar.beats[0]
      : new Beat<Guitar>(bar, bar.trackContext, [], barsInfo.beatsDuration);
    newBeat.baseDuration = barsInfo.beatsDuration;
    for (let j = 0; j < bar.trackContext.instrument.maxPolyphony; j++) {
      if (excludedStrings.includes(j + 1)) {
        continue;
      }

      const note = new GuitarNote(
        newBeat,
        newBeat.trackContext as TrackContext<Guitar>,
        j + 1,
        j + i
      );
      newBeat.setNote(j, note);
    }

    if (!reusedSeedBeat) {
      bar.appendBeats([newBeat]);
    }
  }

  bar.rebuildTiming();
}

export function fillStaff(staff: Staff<Guitar>, barsInfo: BarsInfo[]): void {
  for (let i = 0; i < barsInfo.length; i++) {
    const result =
      staff.bars[i] ?? staff.appendBar(staff.track.score.masterBars[i]);

    fillBar(result, barsInfo[i]);
  }
}

export function fillTrack(
  track: Track<Guitar>,
  info: {
    instrument: MusicInstrument;
    stavesInfo: BarsInfo[][];
    name: string;
  }
): void {
  for (let i = 0; i < info.stavesInfo.length; i++) {
    const staff =
      i === 0
        ? track.staves[0]
        : track.insertStaff(track.staves.length).staves[0];

    fillStaff(staff, info.stavesInfo[i]);
  }
}

export function createScore(
  scoreName: string,
  artist: string,
  songName: string,
  masterBarsCount: number,
  tracksInfo: {
    instrument: MusicInstrument;
    stavesInfo: BarsInfo[][];
    name: string;
  }[]
): Score {
  const score = new Score([], scoreName, artist, songName);

  score.tracks.splice(0, score.tracks.length);
  score.masterBars.splice(0, score.masterBars.length);

  for (let i = 0; i < masterBarsCount; i++) {
    score.appendMasterBar();
  }

  for (const info of tracksInfo) {
    const result = score.addTrack(info.instrument, info.name);
    fillTrack(result.tracks[0] as Track<Guitar>, info);
  }

  return score;
}
