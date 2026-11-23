"""Check the shipped WAVs and the offline extractor using only Python's stdlib."""

import hashlib
import importlib.util
import json
import math
from pathlib import Path
import struct
import sys
import tempfile
import unittest


DIRECTORY = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("extract_samples", DIRECTORY / "scripts" / "extract-samples.py")
EXTRACTOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACTOR)


class SamplesTest(unittest.TestCase):
    """Protect actual asset identity, tuning, and the supported WAV loop contract."""

    def test_shipped_samples(self):
        manifest = json.loads((DIRECTORY / "manifest.json").read_text())
        self.assertEqual(manifest["sourceSha256"], EXTRACTOR.SOURCE_SHA256)
        self.assertEqual(len(manifest["samples"]), 6)
        self.assertEqual(
            hashlib.sha256((DIRECTORY / "COPYING").read_bytes()).hexdigest(),
            manifest["licenseSha256"],
        )
        expected = {item[0]: item for item in EXTRACTOR.SELECTIONS}
        for sample in manifest["samples"]:
            with self.subTest(file=sample["file"]):
                data = (DIRECTORY / sample["file"]).read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), sample["sha256"])
                self.assertEqual(len(data), sample["bytes"])
                self.assertEqual(data[:4], b"RIFF")
                self.assertEqual(data[8:12], b"WAVE")
                self.assertEqual(struct.unpack_from("<I", data, 4)[0], len(data) - 8)
                chunks = EXTRACTOR.chunks(data, 12, len(data))
                fmt = struct.unpack("<HHIIHH", chunks[b"fmt "])
                self.assertEqual(fmt, (1, 1, sample["sampleRate"], sample["sampleRate"] * 2, 2, 16))
                metadata = struct.unpack("<15I", chunks[b"smpl"])
                self.assertEqual(metadata[3], expected[sample["file"]][3])
                self.assertEqual(metadata[7:], (1, 0, 0, 0, sample["loopStartFrame"], sample["loopEndFrameExclusive"] - 1, 0, 0))
                self.assertEqual(len(chunks[b"data"]) // 2, sample["frames"])
                self.assertLess(sample["loopStartFrame"], sample["loopEndFrameExclusive"])
                self.assertEqual(sample["loopEndFrameExclusive"], sample["frames"])
                tuning = sample["sourceFineTuneCents"] + 100 * sample["sourceCoarseTuneSemitones"] + sample["sourcePitchCorrectionCents"]
                error = 1200 * math.log2(sample["sampleRate"] / sample["sourceSampleRate"]) - tuning
                self.assertLess(abs(error), 0.04)
                values = struct.unpack("<" + "h" * sample["frames"], chunks[b"data"])
                loop = values[sample["loopStartFrame"]:sample["loopEndFrameExclusive"]]
                seam = abs(loop[-1] - loop[0])
                self.assertEqual(seam, sample["loopSeamDelta"])
                self.assertLessEqual(seam, 2 * sample["loopAdjacentDeltaRms"])
        self.assertLess(sum(s["bytes"] for s in manifest["samples"]), 1_100_000)

    def test_wrong_bank_is_rejected_without_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "wrong.sf2"
            source.write_bytes(b"not the original bank")
            with self.assertRaisesRegex(ValueError, "Source hash"):
                EXTRACTOR.extract(source, root)
            self.assertEqual(list(root.iterdir()), [source])


if __name__ == "__main__":
    unittest.main()
