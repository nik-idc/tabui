import {
  Track,
  Bar,
  Beat,
  Note,
  NoteValue,
  NoteDuration,
  Guitar,
  Score,
  GuitarNote,
  DEFAULT_ELECTRIC_GUITARS,
  Staff,
  ScoreEditor,
  MusicInstrument,
  TrackContext,
} from "@/index";

type BarsInfo = {
  beatsCount: number;
  beatsDuration: NoteDuration;
};

const excludedStrings = [1, 5, 6];

export function fillBar(bar: Bar, barsInfo: BarsInfo): void {
  for (let i = 0; i < barsInfo.beatsCount - 1; i++) {
    const result = bar.appendBeat();
    const beat = result.beats[0];
  }

  for (let i = 0; i < barsInfo.beatsCount; i++) {
    const beat = bar.beats[i];
    for (let j = 0; j < bar.trackContext.instrument.maxPolyphony; j++) {
      if (excludedStrings.includes(j + 1)) {
        continue;
      }

      const note = new GuitarNote(
        beat as Beat<Guitar>,
        beat.trackContext as TrackContext<Guitar>,
        j + 1,
        j + i
      );
      bar.beats[i].setNote(j, note);
    }
  }
}

export function fillStaff(staff: Staff, barsInfo: BarsInfo[]): void {
  for (let i = 0; i < barsInfo.length; i++) {
    const result = staff.appendBar(staff.track.score.masterBars[i]);

    fillBar(result, barsInfo[i]);
  }
}

export function fillTrack(
  track: Track,
  stavesCount: number = 1,
  barsInfo: BarsInfo[]
): void {
  for (let i = 0; i < stavesCount; i++) {
    const result = track.insertStaff(
      track.staves.length === 0 ? 0 : track.staves.length
    );

    fillStaff(result.staves[0], barsInfo);
  }
}

export function createScore(
  scoreName: string,
  artist: string,
  songName: string,
  tracksInfo: { instrument: MusicInstrument; name: string }[],
  barsInfo: BarsInfo[]
): Score {
  const score = new Score([], scoreName, artist, songName);

  for (let i = 0; i < barsInfo.length; i++) {
    score.appendMasterBar();
  }

  for (const info of tracksInfo) {
    const result = score.addTrack(info.instrument, info.name);
    fillTrack(result.tracks[0], 1, barsInfo);
  }

  return score;
}

// export function getBeats(
//   count: number,
//   guitar: Guitar,
//   duration: NoteDuration,
//   affectedStrings: number[],
//   notes: number[]
// ): Beat<Guitar>[] {
//   let beats: Beat<Guitar>[] = [];
//   for (let i = 0; i < count; i++) {
//     beats.push(new Beat(guitar, duration, notesArr));
//     const notesArr: GuitarNote[] = [];
//     for (let j = 1; j <= guitar.stringsCount; j++) {
//       const fretVal = affectedStrings.includes(j) ? notes[i % 4] : undefined;
//       notesArr.push(new GuitarNote());
//     }
//   }

//   return beats;
// }

// export function createTrack(
//   name: string,
//   stringsCount: number,
//   tuning: Note<Guitar>[],
//   affectedStrings: number[]
// ): Track<Guitar> {
//   const track = new Track<Guitar>();

//   const staffCount = 1;
//   const fretsCount = 24;
//   const guitar = DEFAULT_ELECTRIC_GUITARS["Electric Clean"];

//   const notes = [8, 10, 12, 13];

//   const staff = new Staff();

//   const bars = [
//     new Bar(
//       guitar,
//       120,
//       4,
//       NoteDuration.Quarter,
//       getBeats(4, guitar, NoteDuration.Quarter, affectedStrings, notes)
//     ),
//     new Bar(
//       guitar,
//       120,
//       4,
//       NoteDuration.Quarter,
//       getBeats(8, guitar, NoteDuration.Eighth, affectedStrings, notes)
//     ),
//     new Bar(
//       guitar,
//       120,
//       4,
//       NoteDuration.Quarter,
//       getBeats(16, guitar, NoteDuration.Sixteenth, affectedStrings, notes)
//     ),
//   ];

//   return new Track(name, "guitar", guitar, bars);
// }
