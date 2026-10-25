# Demo sustain samples

These recordings are by Jason Champion, from [Free Wave Samples](https://freewavesamples.com/).
Their [sample license](https://freewavesamples.com/about-us-license) applies.
They are not MIT-licensed and do not ship in the npm package. The original source
credits in the WAV files are retained.

TabUI's versions keep the first 200 ms unchanged, then use a level-controlled,
crossfaded sustain region. An authored WAV `smpl` loop repeats the sustain, not
the attack. The player applies the final release envelope.

## Maintenance

Requires Python 3 and NumPy. Run from the repository root with a directory of the
six **unmodified original recordings**, not the prepared files in this folder:

```sh
python3 assets/samples/scripts/prepare-sustain-samples.py /path/to/original-recordings
```

The script checks original hashes, rejects its own outputs, and replaces the six
WAV files in this folder. Original recordings are available in Git history.
