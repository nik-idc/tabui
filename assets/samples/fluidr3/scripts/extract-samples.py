"""Extract the pinned FluidR3 demo subset without a SoundFont runtime dependency."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import struct


SOURCE_URL = "https://github.com/pianobooster/fluid-soundfont/releases/download/v3.1/FluidR3_GM.sf2"
SOURCE_SHA256 = "74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0"
LICENSE_SHA256 = "8ef830b65c97a976b86e34bb5fde08d99dfb1db13c4149b5b20bc837ac6c4568"
SELECTIONS = (
    ("clean-electric-B3.wav", 27, "Clean Guitar", 59, "Clean F50"),
    ("overdrive-electric-B3.wav", 29, "Overdrive Guitar", 59, "Distortion B4"),
    ("distorted-electric-B3.wav", 30, "Distortion Guitar", 59, "Distortion B0"),
    ("nylon-acoustic-B3.wav", 24, "Nylon Guitar", 59, "Nylon B4"),
    ("steel-acoustic-B3.wav", 25, "Steel String Guitar", 59, "Steel B4"),
    ("fingered-bass-C2.wav", 33, "Fingered Bass", 36, "Finger Bass A3"),
)


def digest(data):
    """Return a stable SHA-256 identity for input or output bytes."""
    return hashlib.sha256(data).hexdigest()


def chunks(data, start, end):
    """Read bounded RIFF chunks, including nested SoundFont LIST chunks."""
    result = {}
    while start + 8 <= end:
        name, size = struct.unpack_from("<4sI", data, start)
        body = start + 8
        if body + size > end:
            raise ValueError("RIFF chunk exceeds its parent")
        if name == b"LIST":
            result.update(chunks(data, body + 4, body + size))
        else:
            if name in result:
                raise ValueError("Duplicate RIFF chunk")
            result[name] = data[body : body + size]
        start = body + size + size % 2
    return result


def signed(value):
    """Read a signed SoundFont generator amount stored in an unsigned field."""
    return value if value < 32768 else value - 65536


def text(value):
    """Decode a fixed-width SoundFont name."""
    return value.rstrip(b"\0").decode("ascii")


def zones(bags, generators, first, last):
    """Expand zone generator ranges without interpreting synthesis opcodes."""
    return [
        dict(generators[bags[i][0] : bags[i + 1][0]])
        for i in range(first, last)
    ]


def riff_chunk(name, body):
    """Write a RIFF chunk with its required even-byte padding."""
    return name + struct.pack("<I", len(body)) + body + b"\0" * (len(body) % 2)


def extract(source, output):
    """Validate the pinned bank and write six source-derived mono sustain WAVs."""
    data = source.read_bytes()
    if digest(data) != SOURCE_SHA256:
        raise ValueError("Source hash does not match the audited FluidR3 bank")
    if digest((output / "COPYING").read_bytes()) != LICENSE_SHA256:
        raise ValueError("The original FluidR3 license must accompany the outputs")
    if data[:4] != b"RIFF" or data[8:12] != b"sfbk":
        raise ValueError("Expected an uncompressed SF2 bank")
    table = chunks(data, 12, len(data))

    def records(name, fmt):
        return list(struct.iter_unpack("<" + fmt, table[name]))

    instruments = records(b"inst", "20sH")
    instrument_bags = records(b"ibag", "HH")
    instrument_generators = records(b"igen", "HH")
    presets = records(b"phdr", "20sHHHIII")
    preset_bags = records(b"pbag", "HH")
    preset_generators = records(b"pgen", "HH")
    samples = records(b"shdr", "20sIIIIIBbHH")
    outputs = []
    for filename, program, instrument_name, root, sample_name in SELECTIONS:
        instrument_id = next(
            i for i, item in enumerate(instruments) if text(item[0]) == instrument_name
        )
        preset_id = next(
            i for i, item in enumerate(presets) if item[1:3] == (program, 0)
        )
        preset_zones = zones(
            preset_bags, preset_generators,
            presets[preset_id][3], presets[preset_id + 1][3],
        )
        # These presets add no pitch or sample-offset generators. Do not silently
        # ignore them if the extraction recipe is later extended to another bank.
        for zone in preset_zones:
            if any(zone.get(op, 0) for op in (0, 1, 2, 3, 4, 12, 45, 50, 51, 52)):
                raise ValueError("Unsupported preset tuning or sample offset")
        if not any(zone.get(41) == instrument_id for zone in preset_zones):
            raise ValueError("Preset does not reference the selected instrument")
        instrument_zones = zones(
            instrument_bags, instrument_generators,
            instruments[instrument_id][1], instruments[instrument_id + 1][1],
        )
        global_zone = instrument_zones[0] if 53 not in instrument_zones[0] else {}
        matches = [
            (i, global_zone | zone)
            for i, zone in enumerate(instrument_zones)
            if 53 in zone and (global_zone | zone).get(58) == root
        ]
        # Electric instruments duplicate each PCM source in a second filtered
        # layer. Select the first layer once, not a sum of both copies.
        zone_index, zone = matches[0]
        sample_id = zone[53]
        sample = samples[sample_id]
        name, start, end, loop_start, loop_end, rate, header_root, correction, _, kind = sample
        if text(name) != sample_name or kind != 1 or zone.get(54) != 1:
            raise ValueError("Expected the audited mono sample and continuous loop")
        # SoundFont offsets use signed frames plus signed 32768-frame units.
        start += signed(zone.get(0, 0)) + 32768 * signed(zone.get(4, 0))
        end += signed(zone.get(1, 0)) + 32768 * signed(zone.get(12, 0))
        loop_start += signed(zone.get(2, 0)) + 32768 * signed(zone.get(45, 0))
        loop_end += signed(zone.get(3, 0)) + 32768 * signed(zone.get(50, 0))
        if not 0 <= start < loop_start < loop_end <= end <= len(table[b"smpl"]) // 2:
            raise ValueError("Invalid source sample or sustain bounds")
        tuning = 100 * signed(zone.get(51, 0)) + signed(zone.get(52, 0)) + correction
        # Changing the integer WAV rate applies the SF2 tuning without altering
        # PCM or loop frames. The rounding error is recorded and below 0.04 cent.
        output_rate = round(rate * 2 ** (tuning / 1200))
        tuning_error = 1200 * math.log2(output_rate / rate) - tuning
        if abs(tuning_error) > 0.04:
            raise ValueError("WAV rate rounding introduces too much pitch error")
        pcm = table[b"smpl"][2 * start : 2 * loop_end]
        local_start, local_end = loop_start - start, loop_end - start
        values = struct.unpack("<" + "h" * (len(pcm) // 2), pcm)
        loop = values[local_start:local_end]
        loop_rms = math.sqrt(sum(v * v for v in loop) / len(loop))
        delta_rms = math.sqrt(
            sum((b - a) ** 2 for a, b in zip(loop, loop[1:])) / (len(loop) - 1)
        )
        seam = abs(loop[-1] - loop[0])
        if loop_rms < 100 or seam > 2 * delta_rms:
            raise ValueError("Source loop fails the basic energy/seam check")
        fmt = struct.pack("<HHIIHH", 1, 1, output_rate, output_rate * 2, 2, 16)
        # SF2 loop end is exclusive; WAV smpl loop end is inclusive. Zero loop
        # type and play count mean infinite forward sustain, as TabUI expects.
        smpl = struct.pack(
            "<15I", 0, 0, round(1e9 / output_rate), root, 0, 0, 0, 1, 0,
            0, 0, local_start, local_end - 1, 0, 0,
        )
        body = b"WAVE" + riff_chunk(b"fmt ", fmt) + riff_chunk(b"smpl", smpl)
        body += riff_chunk(b"data", pcm)
        wav = b"RIFF" + struct.pack("<I", len(body)) + body
        (output / filename).write_bytes(wav)
        outputs.append({
            "file": filename,
            "sha256": digest(wav),
            "bytes": len(wav),
            "program": program,
            "bank": 0,
            "instrument": instrument_name,
            "instrumentId": instrument_id,
            "instrumentZoneIndex": zone_index,
            "matchingRootZones": len(matches),
            "sample": sample_name,
            "sampleId": sample_id,
            "sampleHeaderRoot": header_root,
            "rootMidi": root,
            "sourceFineTuneCents": signed(zone.get(52, 0)),
            "sourceCoarseTuneSemitones": signed(zone.get(51, 0)),
            "sourcePitchCorrectionCents": correction,
            "sourceSampleRate": rate,
            "sampleRate": output_rate,
            "tuningErrorCents": round(tuning_error, 8),
            "frames": len(values),
            "loopStartFrame": local_start,
            "loopEndFrameExclusive": local_end,
            "loopRms": round(loop_rms, 4),
            "loopSeamDelta": seam,
            "loopAdjacentDeltaRms": round(delta_rms, 4),
        })
    manifest = {
        "sourceUrl": SOURCE_URL,
        "sourceSha256": SOURCE_SHA256,
        "sourceBytes": len(data),
        "license": "MIT",
        "licenseSha256": LICENSE_SHA256,
        "recipe": "One unfiltered PCM layer per tone; source tuning encoded in WAV rate; original loops; post-loop tails removed.",
        "samples": outputs,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("soundfont", type=Path, help="Unmodified FluidR3_GM.sf2")
    arguments = parser.parse_args()
    extract(arguments.soundfont, Path(__file__).resolve().parents[1])
