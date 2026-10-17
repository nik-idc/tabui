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
} from "@atikincode/tabui";

type BarsInfo = {
  beatsCount: number;
  beatsDuration: NoteDuration;
};

/** A staff uses repeated-beat data or a custom function for detailed notation. */
type StaffInfo = BarsInfo[] | ((staff: Staff<Guitar>) => void);

type TrackInfo = {
  instrument: MusicInstrument;
  stavesInfo: StaffInfo[];
  name: string;
};

export function fillBar(bar: Bar<Guitar>, barsInfo: BarsInfo): void {
  const voiceBar = bar.getVoiceBar(1) ?? bar.insertVoiceBar(1);
  const beats: Beat<Guitar>[] = [];

  for (let i = 0; i < barsInfo.beatsCount; i++) {
    const newBeat = new Beat<Guitar>(
      voiceBar,
      voiceBar.trackContext,
      [],
      barsInfo.beatsDuration
    );
    newBeat.baseDuration = barsInfo.beatsDuration;
    newBeat.makeBeatWithNotes();
    for (let j = 0; j < bar.trackContext.instrument.maxPolyphony; j++) {
      const note = new GuitarNote(
        newBeat,
        newBeat.trackContext as TrackContext<Guitar>,
        j + 1,
        j + i
      );
      newBeat.setNote(j, note);
    }

    beats.push(newBeat);
  }

  voiceBar.replaceBeats(beats);
}

export function fillStaff(staff: Staff<Guitar>, barsInfo: BarsInfo[]): void {
  for (let i = 0; i < barsInfo.length; i++) {
    const result =
      staff.bars[i] ?? staff.appendBar(staff.track.score.masterBars[i]);

    fillBar(result, barsInfo[i]);
  }
}

export function fillTrack(track: Track<Guitar>, info: TrackInfo): void {
  for (let i = 0; i < info.stavesInfo.length; i++) {
    const staff =
      i === 0
        ? track.staves[0]
        : track.insertStaff(track.staves.length).staves[0];

    const staffInfo = info.stavesInfo[i];
    if (typeof staffInfo === "function") {
      staffInfo(staff);
    } else {
      fillStaff(staff, staffInfo);
    }
  }
}

/** Builds a fresh score and its staff structure; no arguments produce the default empty score. */
export function createScore(
  scoreName?: string,
  artist?: string,
  songName?: string,
  masterBarsCount = 1,
  tracksInfo: TrackInfo[] = [
    {
      instrument: new Guitar(),
      stavesInfo: [[]],
      name: "Track 1",
    },
  ]
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
