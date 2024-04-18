import { Chord } from "./chord";
import { Guitar } from "./guitar";

export class GuitarNote {
  readonly guitar: Guitar;
  private _strNum: number = 0;
  private _fret: string | null = null;

  constructor(guitar: Guitar, strNum: number, fret: string | null) {
    this.guitar = guitar;
    this.strNum = strNum;
    this.fret = fret;
  }

  get strNum(): number {
    return this._strNum;
  }

  set strNum(val: number) {
    // Check string validity
    if (val <= 0 || val > this.guitar.stringsCount) {
      throw new Error(`${val} is an invalid string number, only strings
				1 to ${this.guitar.stringsCount} are allowed`);
    }

    this._strNum = val;
  }

  get fret(): string | null {
    return this._fret;
  }

  set fret(val: string | null) {
    // Check string validity
    let fretsCount = this.guitar.fretsCount;
    if (val != null && Number.isNaN(Number(val)) && val != "x") {
      throw new Error(`${val} is an invalid fret symbol,
				apart from numbers (0-${fretsCount}) the only symbol allowed is 'x'`);
    }

    if (!Number.isNaN(Number(val)) && Number(val) > fretsCount) {
      this._fret = `${Number(val) % fretsCount}`;
    } else {
      this._fret = val;
    }
  }

  static fromObject(obj: any): GuitarNote {
    if (
      obj.guitar === undefined ||
      obj._strNum === undefined ||
      obj._fret === undefined
    ) {
      throw new Error("Invalid js object to parse to guitar note");
    }

    let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    let guitarNote = new GuitarNote(guitar, obj._strNum, obj._fret); // Create guitar note instance
    return guitarNote;
  }
}
