import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { randomInt } from "../misc/random-int";
/**
 * Class that represents a beat
 */
export class Beat {
    /**
     * Beat's unique identifier
     */
    uuid;
    /**
     * Guitar on which the beat is played
     */
    guitar;
    /**
     * Note duration
     */
    duration;
    /**
     * Beat notes
     */
    notes;
    /**
     * Class that represents a beat
     * @param guitar Guitar on which the beat is played
     * @param duration Note duration
     */
    constructor(guitar, duration) {
        this.uuid = randomInt();
        this.guitar = guitar;
        this.duration = duration;
        this.notes = Array.from({ length: guitar.stringsCount }, (_, stringNum) => new GuitarNote(this.guitar, stringNum + 1, undefined));
    }
    deepCopy() {
        const beat = new Beat(this.guitar, this.duration);
        for (let i = 0; i < this.notes.length; i++) {
            beat.notes[i] = this.notes[i].deepCopy();
        }
        return beat;
    }
    /**
     * Parses a JSON object and returns a beat object
     * @param obj Beat object
     * @returns Parsed beat object
     */
    static fromObject(obj) {
        if (obj.guitar === undefined ||
            obj.duration === undefined ||
            obj.notes === undefined) {
            throw Error("Invalid js object to parse to beat");
        }
        let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
        let beat = new Beat(guitar, obj._duration); // Craete beat instance
        beat.notes.length = 0; // Delete default notes
        obj.notes.forEach((note) => beat.notes.push(GuitarNote.fromObject(note)));
        return beat;
    }
    /**
     * Compares two beats for equality (ignores uuid)
     * @param beat1 Beat 1
     * @param beat2 Beat 2
     * @returns True if equal (ignoring uuid)
     */
    static compare(beat1, beat2) {
        // Definitely not the same with different guitars/durations
        if (beat1.guitar !== beat2.guitar ||
            beat1.duration !== beat2.duration) {
            return false;
        }
        // Compare notes
        for (let i = 0; i < beat1.guitar.stringsCount; i++) {
            if (!GuitarNote.compare(beat1.notes[i], beat2.notes[i])) {
                return false;
            }
        }
        // If all is the same then beats are equal
        return true;
    }
}
//# sourceMappingURL=beat.js.map