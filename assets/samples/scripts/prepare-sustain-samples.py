"""Prepare the six demo sustain loops. Requires Python 3 and NumPy.

Usage: python3 assets/samples/scripts/prepare-sustain-samples.py ORIGINAL_DIRECTORY
The input must contain the unmodified recordings (hashes below). Outputs replace
assets/samples/*.wav. Loop points are authored per recording, never found at runtime.
"""

import hashlib
import io
from pathlib import Path
import struct
import sys
import wave

import numpy as np


# Original SHA-256, exclusive loop end frame, sustain level below early RMS (dB).
# Stereo overlaps avoid the recorded attacks; bass uses its earlier tonal region.
RECIPES = {
    "Alesis-Fusion-Clean-Guitar-C3.wav": (
        "65e324306d61357e4026d904c3bd6e1f9bdb0b53868b317c085607689e909345", 37780, 6),
    "Alesis-Fusion-Nylon-String-Guitar-C4.wav": (
        "ef1932503766f9ed8fd17ff6b4fefbb2f92ec21677e2a6741e93ebaa608ee36a", 45185, 6),
    "Alesis-Fusion-Steel-String-Guitar-C4.wav": (
        "ad5d32cb5354e9a2fa8e782b04a452151f59060637585de8cf15f1a9082649d4", 37541, 6),
    "Alesis-S4-Plus-FatSynSlap-C2.wav": (
        "7adbddd6ca3bd1115418baa3bf13e87558db3726ee39e84cae0fd3076616df76", 21349, 6),
    "Roland-SC-88-Distorted-Guitar-C3.wav": (
        "95ffe78035bed58d26a36bd45e603c16d55fd483481870405c056d893cdab92f", 53616, 3),
    "Roland-SC-88-Overdriven-Guitar-C3.wav": (
        "49c6d03075de42894315a936a08ae42b1a68f0bf5832c49b616f9a6d950a2323", 37753, 3),
}


def smoothstep(t):
    """Blend with zero slope at both ends."""
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def prepare(source, destination, digest, end, below_early_db):
    """Keep the attack, level the sustain, and crossfade a long stereo loop."""
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != digest:
        raise ValueError(f"Expected original recording: {source}")
    with wave.open(io.BytesIO(raw)) as wav:
        assert wav.getparams()[:3] == (2, 2, 44100)
        x = np.frombuffer(wav.readframes(wav.getnframes()), "<i2")
        x = x.reshape(-1, 2).astype(np.float64) / 32768
    rate = 44100
    start = 24255  # 0.55 s, after the attack and early decay in each source.
    overlap = 5292  # 120 ms, many periods rather than a short buzzy waveform.
    gain_end = 18963
    if source.name == "Alesis-S4-Plus-FatSynSlap-C2.wav":
        # The late synth-bass tail loses its root to non-harmonic sub-tones.
        # Sustain its earlier tonal region, after the slap attack instead.
        start, overlap, gain_end = 13230, 1764, 11025
    target = np.sqrt(np.mean(x[4410:8820] ** 2)) * 10 ** (-below_early_db / 20)
    # Centered 80 ms RMS follows slow recorded decay, not individual cycles.
    power = np.mean(x * x, axis=1)
    padded = np.pad(power, (1764, 1764), mode="edge")
    cumulative = np.concatenate(([0], np.cumsum(padded)))
    rms = np.sqrt((cumulative[3529:] - cumulative[:-3529]) / 3529)
    gain = target / np.maximum(rms, 1e-6)
    blend = smoothstep((np.arange(len(x)) - 8820) / (gain_end - 8820))
    x *= (1 + blend * (gain - 1))[:, None]
    # Fade toward the material immediately BEFORE loopStart. The wrap then
    # continues that waveform instead of jumping between unrelated phases.
    blend = smoothstep(np.arange(overlap) / (overlap - 1))[:, None]
    x[end-overlap:end] = (
        x[end-overlap:end] * (1-blend) + x[start-overlap:start] * blend
    )
    x = x[:end]
    assert np.max(np.abs(x)) < 1, "Preparation must not clip"
    pcm = np.rint(x * 32768).astype("<i2").tobytes()
    # Preserve all original non-audio chunks, including any attribution.
    chunks = []
    offset = 12
    while offset + 8 <= len(raw):
        name = raw[offset:offset+4]
        size = struct.unpack_from("<I", raw, offset+4)[0]
        body = raw[offset+8:offset+8+size]
        if name == b"data":
            body = pcm
        if name != b"smpl":
            chunks.append(name + struct.pack("<I", len(body)) + body + b"\0" * (len(body) % 2))
        offset += 8 + size + size % 2
    # Standard WAV smpl: one infinite forward loop, inclusive final frame.
    root_midi = (int(source.stem[-1]) + 1) * 12
    body = struct.pack("<15I", 0, 0, round(1e9/rate), root_midi, 0, 0, 0, 1, 0,
                       0, 0, start, end-1, 0, 0)
    chunks.append(b"smpl" + struct.pack("<I", len(body)) + body)
    payload = b"WAVE" + b"".join(chunks)
    destination.write_bytes(b"RIFF" + struct.pack("<I", len(payload)) + payload)
    seam = abs(x[-1] - x[start])
    print(f"{source.name}: loop {start}:{end}, seam {seam}, target {20*np.log10(target):.2f} dBFS")


if __name__ == "__main__":
    output = Path(__file__).resolve().parents[1]
    source = Path(sys.argv[1])
    for name, recipe in RECIPES.items():
        prepare(source / name, output / name, *recipe)
