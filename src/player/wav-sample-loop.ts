/** RIFF/WAVE container fields and sizes, in bytes; FourCC values use big-endian reads. */
const wavContainer = {
  /** RIFF container identifier. */
  riffId: 0x52494646,
  /** WAVE form identifier. */
  waveId: 0x57415645,
  /** Offset of the WAVE form identifier. */
  formOffset: 8,
  /** Size of the RIFF header, including its form identifier. */
  headerBytes: 12,
  /** Offset of a chunk's payload-size field, including the outer RIFF chunk. */
  chunkSizeOffset: 4,
  /** Chunk identifier and size fields before each payload. */
  chunkHeaderBytes: 8,
  /** RIFF chunks are padded to this byte boundary. */
  chunkAlignmentBytes: 2,
} as const;

/** WAV format-chunk fields and sizes, in bytes. */
const wavFormat = {
  /** Format chunk identifier ("fmt "). */
  id: 0x666d7420,
  /** Minimum payload size containing the standard format fields. */
  minBytes: 16,
  /** Sample-rate field offset from the payload start, in Hz. */
  sampleRateOffset: 4,
} as const;

/** WAV sampler-chunk fields, with byte offsets from its payload start. */
const wavSampler = {
  /** Sampler chunk identifier ("smpl"). */
  id: 0x736d706c,
  /** Minimum payload size containing one complete loop record. */
  minBytes: 60,
  /** Number of authored loops. */
  loopCountOffset: 28,
  /** First loop's direction field. */
  typeOffset: 40,
  /** First loop's inclusive start frame. */
  startOffset: 44,
  /** First loop's inclusive end frame. */
  endOffset: 48,
  /** First loop's fractional-frame adjustment. */
  fractionOffset: 52,
  /** First loop's repeat count. */
  playCountOffset: 56,
  /** Direction value for a forward loop. */
  forwardType: 0,
  /** Repeat-count value for a loop that runs until the source stops. */
  infinitePlayCount: 0,
} as const;

/** Authored forward sustain loop, in decoded-buffer seconds. */
export interface PlaybackSampleLoop {
  /** Inclusive loop start in seconds, used by Web Audio. */
  start: number;
  /** Exclusive loop end in seconds, used by Web Audio. */
  end: number;
}

/** Reads one infinite forward loop from a WAV smpl chunk; other formats stay one-shot. */
export function readSampleLoop(
  bytes: ArrayBuffer
): PlaybackSampleLoop | undefined {
  const view = new DataView(bytes);
  if (
    view.byteLength < wavContainer.headerBytes ||
    view.getUint32(0) !== wavContainer.riffId
  ) {
    return;
  }
  if (view.getUint32(wavContainer.formOffset) !== wavContainer.waveId) {
    return;
  }
  const limit = Math.min(
    view.byteLength,
    view.getUint32(wavContainer.chunkSizeOffset, true) +
      wavContainer.chunkHeaderBytes
  );
  let sampleRate = 0;
  let loop: { start: number; end: number } | undefined;
  let offset = wavContainer.headerBytes;
  for (; offset + wavContainer.chunkHeaderBytes <= limit; ) {
    const id = view.getUint32(offset);
    const size = view.getUint32(offset + wavContainer.chunkSizeOffset, true);
    const data = offset + wavContainer.chunkHeaderBytes;
    if (data + size > limit) {
      return;
    }
    if (id === wavFormat.id && size >= wavFormat.minBytes) {
      sampleRate = view.getUint32(data + wavFormat.sampleRateOffset, true);
    }
    if (id === wavSampler.id && size >= wavSampler.minBytes) {
      const count = view.getUint32(data + wavSampler.loopCountOffset, true);
      const type = view.getUint32(data + wavSampler.typeOffset, true);
      const fraction = view.getUint32(data + wavSampler.fractionOffset, true);
      const playCount = view.getUint32(data + wavSampler.playCountOffset, true);
      const supportedLoop =
        count === 1 &&
        type === wavSampler.forwardType &&
        fraction === 0 &&
        playCount === wavSampler.infinitePlayCount;
      if (supportedLoop) {
        loop = {
          start: view.getUint32(data + wavSampler.startOffset, true),
          // WAV stores an inclusive end frame; Web Audio uses an exclusive end.
          end: view.getUint32(data + wavSampler.endOffset, true) + 1,
        };
      }
    }
    offset = data + size + (size % wavContainer.chunkAlignmentBytes);
  }
  if (sampleRate > 0 && loop !== undefined && loop.start < loop.end) {
    return { start: loop.start / sampleRate, end: loop.end / sampleRate };
  }
}
