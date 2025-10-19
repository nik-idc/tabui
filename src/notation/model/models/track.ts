import { Bar } from "./bar";

export class Track {
  constructor(
    public name: string,
    public instrumentName: string,
    public bars: Bar[]
  ) {}
}
