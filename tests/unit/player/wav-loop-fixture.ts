/** WAV metadata with a forward loop from 0.25 to 0.75 seconds at 4000 Hz. */
export function createLoopWav(): ArrayBuffer {
  // An odd-sized unknown chunk checks RIFF padding and chunk traversal.
  const bytes = new ArrayBuffer(114);
  const view = new DataView(bytes);
  view.setUint32(0, 0x52494646);
  view.setUint32(4, 106, true);
  view.setUint32(8, 0x57415645);
  view.setUint32(12, 0x4a554e4b);
  view.setUint32(16, 1, true);
  // fmt: 16 bytes, recorded at 4000 Hz.
  view.setUint32(22, 0x666d7420);
  view.setUint32(26, 16, true);
  view.setUint32(34, 4000, true);
  view.setUint32(46, 0x736d706c);
  view.setUint32(50, 60, true);
  // smpl: one forward loop, frames 1000 through 2999 inclusive, unlimited repeats.
  view.setUint32(82, 1, true);
  view.setUint32(98, 1000, true);
  view.setUint32(102, 2999, true);
  view.setUint32(110, 0, true);
  return bytes;
}
