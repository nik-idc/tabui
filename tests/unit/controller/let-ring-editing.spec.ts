import {
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
  serializeScore,
  NoteValue,
} from "../../../src/notation/model";
import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command/set-technique-command";
import { SetFretCommand } from "../../../src/notation/controller/editor/command/set-fret-command";
import { RemoveBeatsCommand } from "../../../src/notation/controller/editor/command/remove-beats-command";
import { InsertBeatCommand } from "../../../src/notation/controller/editor/command/insert-beat-command";
import { InsertBeatsCommand } from "../../../src/notation/controller/editor/command/insert-beats-command";
import { ReplaceBeatsCommand } from "../../../src/notation/controller/editor/command/replace-beats-command";
import { InsertBarCommand } from "../../../src/notation/controller/editor/command/insert-bar-command";
import { SetRestCommand } from "../../../src/notation/controller/editor/command/set-rest-command";
import { SetNoteCommand } from "../../../src/notation/controller/editor/command/set-note-command";
import { RemoveBarsCommand } from "../../../src/notation/controller/editor/command/remove-bars-command";
import { CommandManager } from "../../../src/notation/controller/editor/command/command-manager";
import { AppendBeatCommand } from "../../../src/notation/controller/editor/command/append-beat-command";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";
import { DEFAULT_MASTER_BAR } from "../../../src/notation/model/master-bar";

function passage(frets: (number | null)[]): GuitarNote[] {
  const { beats } = createBarWithBeats(
    frets.map(() => ({ baseDuration: NoteDuration.Quarter }))
  );
  return beats.map((b, i) => {
    const note = b.notes?.[0] as GuitarNote;
    note.fret = frets[i];
    return note;
  });
}

describe("Let Ring editing", () => {
  test.each(["fret", "pitch", "rest", "technique"])(
    "undo restores Let Ring after a later beat removal and a %s edit",
    (edit) => {
      const notes = passage([5, null, null]);
      ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
      const voice = notes[0].beat.voiceBar;
      const score = voice.bar.staff.track.score;
      const before = serializeScore(score);
      const manager = new CommandManager();
      const clear =
        edit === "fret"
          ? new SetFretCommand(voice.beats[0], 1, null)
          : edit === "pitch"
            ? new SetNoteCommand(voice.beats[0], 1, NoteValue.None, null)
            : edit === "rest"
              ? new SetRestCommand([voice.beats[0]], true)
              : new SetTechniqueCommand(
                  [
                    {
                      ...ScoreEditor.getBeatPosition(voice.beats[0]),
                      stringNumber: 1,
                    },
                  ],
                  GuitarTechniqueType.LetRing
                );
      manager.execute(clear);
      const cleared = serializeScore(score);
      manager.execute(new RemoveBeatsCommand([voice.beats[1]]));
      const removed = serializeScore(score);
      manager.undo();
      manager.undo();
      expect(serializeScore(score)).toEqual(before);
      manager.redo();
      expect(serializeScore(score)).toEqual(cleared);
      expect(
        voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
      ).toEqual([false, false, false]);
      manager.redo();
      expect(voice.beats).toHaveLength(2);
      expect(serializeScore(score)).toEqual(removed);
    }
  );

  test.each(["insert", "paste", "remove"])(
    "undo restores Let Ring slots after %s and a later beat removal",
    (edit) => {
      const notes = passage([5, null, null]);
      ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
      const voice = notes[0].beat.voiceBar;
      const score = voice.bar.staff.track.score;
      const before = serializeScore(score);
      const manager = new CommandManager();
      const blank = voice.beats[0].deepCopy();
      blank.makeRest();
      const command =
        edit === "insert"
          ? new InsertBeatCommand(voice, 1)
          : edit === "paste"
            ? new InsertBeatsCommand(voice.bar.staff, voice.beats[0], [blank])
            : new RemoveBeatsCommand([voice.beats[0]]);
      manager.execute(command);
      const applied = serializeScore(score);
      manager.execute(new RemoveBeatsCommand([notes[1].beat]));
      const removed = serializeScore(score);
      manager.undo();
      manager.undo();
      expect(serializeScore(score)).toEqual(before);
      manager.redo();
      expect(serializeScore(score)).toEqual(applied);
      const markers =
        edit === "remove"
          ? [false, false]
          : edit === "insert"
            ? [true, true, true, true]
            : [true, false, false, false];
      expect(
        voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
      ).toEqual(markers);
      manager.redo();
      expect(voice.beats).toHaveLength(markers.length - 1);
      expect(serializeScore(score)).toEqual(removed);
    }
  );

  test("unsupported empty markers cannot start or extend a passage", () => {
    const notes = passage([null, null]);
    expect(
      ScoreEditor.canSetTechnique(
        [notes[0].beat],
        GuitarTechniqueType.LetRing,
        1
      )
    ).toBe(false);
    expect(
      ScoreEditor.setTechniqueForNotes([notes[0]], GuitarTechniqueType.LetRing)
    ).toBe(false);
    notes[0].setTechnique(GuitarTechniqueType.LetRing);
    expect(
      ScoreEditor.canSetTechnique(
        [notes[1].beat],
        GuitarTechniqueType.LetRing,
        1
      )
    ).toBe(false);
    expect(
      ScoreEditor.setTechniqueForNotes([notes[1]], GuitarTechniqueType.LetRing)
    ).toBe(false);
    expect(notes[1].hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

  test("appending inside a cross-bar passage creates a marked empty beat, not a rest", () => {
    const notes = passage([5]);
    const first = notes[0].beat;
    const score = first.voiceBar.bar.staff.track.score;
    const result = ScoreEditor.appendMasterBar(score, DEFAULT_MASTER_BAR, 1);
    const next = required([...result.bars.values()][0].getVoiceBar(1)).beats[0];
    next.makeBeatWithNotes();
    ScoreEditor.setTechniqueForNotes(
      [notes[0], required(next.notes)[0]],
      GuitarTechniqueType.LetRing
    );
    const command = new AppendBeatCommand(first.voiceBar);
    command.execute();
    expect(
      first.voiceBar.beats[1].notes?.[0].hasTechnique(
        GuitarTechniqueType.LetRing
      )
    ).toBe(true);
    expect((first.voiceBar.beats[1].notes?.[0] as GuitarNote).fret).toBeNull();
    command.undo();
    command.redo();
    expect(
      first.voiceBar.beats[1].notes?.[0].hasTechnique(
        GuitarTechniqueType.LetRing
      )
    ).toBe(true);
  });

  test("interleaved staff targets still apply each passage in musical order", () => {
    const first = passage([5, null]);
    const second = passage([7, null]);
    ScoreEditor.setTechniqueForNotes(
      [first[1], second[1], first[0], second[0]],
      GuitarTechniqueType.LetRing
    );
    expect(
      [...first, ...second].map((n) =>
        n.hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, true, true, true]);
  });

  test("a reversed selection marks a playable source and its following empty slots", () => {
    const notes = passage([5, null, null]);
    const command = new SetTechniqueCommand(
      notes
        .slice()
        .reverse()
        .map((n) => ({
          ...ScoreEditor.getBeatPosition(n.beat),
          stringNumber: 1,
        })),
      GuitarTechniqueType.LetRing
    );
    command.execute();
    expect(
      notes.map((n) => n.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, true, true]);
    command.undo();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([false, false, false]);
    command.redo();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, true, true]);
  });

  test("removing a middle marker clears orphan empties but keeps the next marked attack and history", () => {
    const notes = passage([5, null, null, 7, null]);
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    const command = new SetTechniqueCommand(
      [{ ...ScoreEditor.getBeatPosition(notes[1].beat), stringNumber: 1 }],
      GuitarTechniqueType.LetRing
    );
    command.execute();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, false, false, true, true]);
    command.undo();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, true, true, true, true]);
    command.redo();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, false, false, true, true]);
  });

  test("clearing a supported attack keeps the passage, but clearing its source removes orphan markers", () => {
    const notes = passage([5, 7, null, 9, null]);
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    const middle = new SetFretCommand(notes[1].beat, 1, null);
    middle.execute();
    expect(
      notes[1].beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
    ).toBe(true);
    const source = new SetFretCommand(notes[0].beat, 1, null);
    source.execute();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([false, false, false, true, true]);
    source.undo();
    middle.undo();
    expect(notes.map((n) => (n.beat.notes?.[0] as GuitarNote).fret)).toEqual([
      5,
      7,
      null,
      9,
      null,
    ]);
    middle.redo();
    source.redo();
    expect(
      notes.map((n) =>
        n.beat.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([false, false, false, true, true]);
  });

  test("deleting a source cleans surviving empty slots and restores them on undo", () => {
    const notes = passage([5, null, null, 7]);
    const voice = notes[0].beat.voiceBar;
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    const command = new RemoveBeatsCommand([notes[0].beat]);
    command.execute();
    expect(
      voice.beats.map((b) =>
        b.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([false, false, true]);
    command.undo();
    expect(
      voice.beats.map((b) =>
        b.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, true, true, true]);
    command.redo();
    expect(
      voice.beats.map((b) =>
        b.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([false, false, true]);
  });

  test("a blank inserted between marked neighbors inherits Let Ring but not Palm Mute", () => {
    const notes = passage([5, 7]);
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    for (const source of notes) {
      const muted = required(source.beat.notes)[1] as GuitarNote;
      muted.fret = 3;
      muted.setTechnique(GuitarTechniqueType.PalmMute);
    }
    const voice = notes[0].beat.voiceBar;
    const command = new InsertBeatCommand(voice, 1);
    command.execute();
    expect(
      voice.beats[1].notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
    ).toBe(true);
    expect(
      voice.beats[1].notes?.[1].hasTechnique(GuitarTechniqueType.PalmMute)
    ).toBe(false);
    command.undo();
    command.redo();
    expect(
      voice.beats[1].notes?.[0].hasTechnique(GuitarTechniqueType.LetRing)
    ).toBe(true);
  });

  test("pasting an unmarked blank breaks a passage without inheriting a marker and undo restores it", () => {
    const notes = passage([5, null, null]);
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    const blank = notes[1].beat.deepCopy();
    blank.notes?.forEach((n) => n.clearTechniques());
    const voice = notes[0].beat.voiceBar;
    const command = new InsertBeatsCommand(voice.bar.staff, notes[0].beat, [
      blank,
    ]);
    command.execute();
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, false, false, false]);
    command.undo();
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, true, true]);
    command.redo();
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, false, false, false]);
  });

  test("replacing a source cleans the following passage and two edits undo after beat identity replacement", () => {
    const notes = passage([5, null, null, 7]);
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    const voice = notes[0].beat.voiceBar;
    const rest = notes[0].beat.deepCopy();
    rest.makeRest();
    const replace = new ReplaceBeatsCommand([notes[0].beat], [rest]);
    replace.execute();
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([false, false, false, true]);
    const remove = new RemoveBeatsCommand([voice.beats[1]]);
    remove.execute();
    remove.undo();
    replace.undo();
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, true, true, true]);
    replace.redo();
    remove.redo();
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([false, false, true]);
  });

  test("inserting a default rest bar breaks a cross-bar passage without creating notes, and undo restores it", () => {
    const notes = passage([5]);
    const first = notes[0].beat;
    const score = first.voiceBar.bar.staff.track.score;
    const output = ScoreEditor.appendMasterBar(score, DEFAULT_MASTER_BAR, 1);
    const next = required([...output.bars.values()][0].getVoiceBar(1)).beats[0];
    next.makeBeatWithNotes();
    ScoreEditor.setTechniqueForNotes(
      [notes[0], required(next.notes)[0]],
      GuitarTechniqueType.LetRing
    );
    const command = new InsertBarCommand(score, 1, DEFAULT_MASTER_BAR);
    command.execute();
    expect(
      required(first.voiceBar.bar.staff.bars[1].getVoiceBar(1)).beats[0].notes
    ).toBeNull();
    expect(next.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
    command.undo();
    expect(next.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    command.redo();
    expect(next.hasTechnique(GuitarTechniqueType.LetRing)).toBe(false);
  });

  test("rest edits stop all strings in their own voice but leave another voice's passage unchanged", () => {
    const notes = passage([5, null, null, 7, null]);
    const voice = notes[0].beat.voiceBar;
    const otherVoice = voice.bar.insertVoiceBar(2);
    otherVoice.replaceBeats(voice.beats.map((b) => b.deepCopy(otherVoice)));
    const otherNotes = otherVoice.beats.map(
      (b) => required(b.notes)[0] as GuitarNote
    );
    const secondString = voice.beats.map((b, i) => {
      const note = required(b.notes)[1] as GuitarNote;
      note.fret = i === 0 ? 3 : null;
      return note;
    });
    ScoreEditor.setTechniqueForNotes(
      [...notes, ...secondString, ...otherNotes],
      GuitarTechniqueType.LetRing
    );
    const command = new SetRestCommand([voice.beats[1]], true);
    command.execute();
    expect(
      voice.beats.map(
        (b) => b.notes?.[0].hasTechnique(GuitarTechniqueType.LetRing) ?? false
      )
    ).toEqual([true, false, false, true, true]);
    expect(
      voice.beats.map(
        (b) => b.notes?.[1].hasTechnique(GuitarTechniqueType.LetRing) ?? false
      )
    ).toEqual([true, false, false, false, false]);
    expect(
      otherVoice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, true, true, true, true]);
    command.undo();
    expect(
      voice.beats.map((b) =>
        b.notes?.[1].hasTechnique(GuitarTechniqueType.LetRing)
      )
    ).toEqual([true, true, true, true, true]);
  });

  test("a dead attack removes its Let Ring passage but keeps a local Palm Mute marking", () => {
    const notes = passage([5, 7, null, 9, null]);
    ScoreEditor.setTechniqueForNotes(notes, GuitarTechniqueType.LetRing);
    const muted = required(notes[1].beat.notes)[1] as GuitarNote;
    muted.fret = 3;
    muted.setTechnique(GuitarTechniqueType.PalmMute);
    ScoreEditor.setFret(notes[1].beat, 1, -1);
    ScoreEditor.setFret(notes[1].beat, 2, -1);
    expect(
      notes.map((n) => n.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([true, false, false, true, true]);
    expect(muted.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
  });

  test("cross-bar paste cleanup survives two undo/redo steps and serialization", () => {
    const notes = passage([5]);
    const first = notes[0].beat;
    const score = first.voiceBar.bar.staff.track.score;
    ScoreEditor.appendMasterBar(score, DEFAULT_MASTER_BAR, 1);
    const voice = required(first.voiceBar.bar.staff.bars[1].getVoiceBar(1));
    voice.beats[0].makeBeatWithNotes();
    voice.insertBeat(1);
    ScoreEditor.setTechniqueForNotes(
      [notes[0], ...voice.beats.map((b) => required(b.notes)[0])],
      GuitarTechniqueType.LetRing
    );
    const original = serializeScore(score);
    const blank = first.deepCopy();
    blank.makeBeatWithNotes();
    blank.notes?.forEach((n) => {
      n.clearTechniques();
      (n as GuitarNote).fret = null;
    });
    const manager = new CommandManager();
    manager.execute(
      new InsertBeatsCommand(first.voiceBar.bar.staff, first, [blank])
    );
    expect(
      voice.beats.map((b) => b.hasTechnique(GuitarTechniqueType.LetRing))
    ).toEqual([false, false]);
    manager.execute(new RemoveBeatsCommand([voice.beats[0]]));
    const applied = serializeScore(score);
    manager.undo();
    manager.undo();
    expect(serializeScore(score)).toEqual(original);
    manager.redo();
    manager.redo();
    expect(serializeScore(score)).toEqual(applied);
  });

  test("removing several source bars cleans the newly joined boundary and restores fixed content", () => {
    const notes = passage([5]);
    const score = notes[0].beat.voiceBar.bar.staff.track.score;
    for (let i = 0; i < 3; i++) {
      ScoreEditor.appendMasterBar(score, DEFAULT_MASTER_BAR, 1);
    }
    const staff = notes[0].beat.voiceBar.bar.staff;
    const slots = staff.bars.map((b, i) => {
      const beat = required(b.getVoiceBar(1)).beats[0];
      beat.makeBeatWithNotes();
      const note = required(beat.notes)[0] as GuitarNote;
      note.fret = i === 0 ? 5 : null;
      return note;
    });
    ScoreEditor.setTechniqueForNotes(slots, GuitarTechniqueType.LetRing);
    const saved = serializeScore(score);
    const command = new RemoveBarsCommand(score, [0, 1]);
    command.execute();
    expect(
      staff.bars.map((b) =>
        required(b.getVoiceBar(1)).beats[0].hasTechnique(
          GuitarTechniqueType.LetRing
        )
      )
    ).toEqual([false, false]);
    command.undo();
    expect(serializeScore(score)).toEqual(saved);
    command.redo();
    expect(
      staff.bars.map((b) =>
        required(b.getVoiceBar(1)).beats[0].hasTechnique(
          GuitarTechniqueType.LetRing
        )
      )
    ).toEqual([false, false]);
  });
});
