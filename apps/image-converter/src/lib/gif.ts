export type GifFrame = {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  delayMs: number;
};

export type GifOptions = { loop: number };

class Bytes {
  values: number[] = [];
  byte(value: number) { this.values.push(value & 0xff); }
  word(value: number) { this.byte(value); this.byte(value >>> 8); }
  text(value: string) { for (const character of value) this.byte(character.charCodeAt(0)); }
  block(data: Uint8Array) {
    for (let offset = 0; offset < data.length; offset += 255) {
      const chunk = data.subarray(offset, offset + 255);
      this.byte(chunk.length);
      for (const value of chunk) this.byte(value);
    }
    this.byte(0);
  }
}

class BitWriter {
  private bytes: number[] = [];
  private current = 0;
  private bits = 0;
  write(code: number, size: number) {
    this.current |= code << this.bits;
    this.bits += size;
    while (this.bits >= 8) {
      this.bytes.push(this.current & 0xff);
      this.current >>>= 8;
      this.bits -= 8;
    }
  }
  finish(): Uint8Array {
    if (this.bits) this.bytes.push(this.current & 0xff);
    return Uint8Array.from(this.bytes);
  }
}

function palette332(): Uint8Array {
  const palette = new Uint8Array(256 * 3);
  for (let index = 0; index < 256; index += 1) {
    palette[index * 3] = Math.round(((index >>> 5) & 7) * 255 / 7);
    palette[index * 3 + 1] = Math.round(((index >>> 2) & 7) * 255 / 7);
    palette[index * 3 + 2] = Math.round((index & 3) * 255 / 3);
  }
  return palette;
}

export function quantize332(rgba: Uint8ClampedArray): Uint8Array {
  const indexed = new Uint8Array(rgba.length / 4);
  for (let source = 0, target = 0; source < rgba.length; source += 4, target += 1) {
    indexed[target] = (rgba[source] & 0xe0) | ((rgba[source + 1] & 0xe0) >>> 3) | (rgba[source + 2] >>> 6);
  }
  return indexed;
}

export function lzwEncode(indices: Uint8Array): Uint8Array {
  const clear = 256;
  const end = 257;
  const writer = new BitWriter();
  let dictionary = new Map<string, number>();
  let nextCode = 258;
  let codeSize = 9;
  const reset = () => {
    dictionary = new Map();
    nextCode = 258;
    codeSize = 9;
  };
  writer.write(clear, codeSize);
  if (!indices.length) {
    writer.write(end, codeSize);
    return writer.finish();
  }
  let prefix = indices[0];
  for (let index = 1; index < indices.length; index += 1) {
    const suffix = indices[index];
    const key = `${prefix},${suffix}`;
    const found = dictionary.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }
    writer.write(prefix, codeSize);
    if (nextCode < 4096) {
      dictionary.set(key, nextCode++);
      // The decoder adds a dictionary entry one emitted code later than the
      // encoder. Keep the boundary code at the old width, then grow.
      if (nextCode > (1 << codeSize) && codeSize < 12) codeSize += 1;
    } else {
      writer.write(clear, codeSize);
      reset();
    }
    prefix = suffix;
  }
  writer.write(prefix, codeSize);
  writer.write(end, codeSize);
  return writer.finish();
}

export function encodeGifBytes(frames: GifFrame[], options: GifOptions = { loop: 0 }): Uint8Array {
  if (!frames.length) throw new Error("gif-empty");
  const { width, height } = frames[0];
  if (width < 1 || height < 1 || width > 4096 || height > 4096) throw new Error("gif-size-limit");
  if (frames.some((frame) => frame.width !== width || frame.height !== height || frame.rgba.length !== width * height * 4)) {
    throw new Error("gif-frame-mismatch");
  }
  const output = new Bytes();
  output.text("GIF89a");
  output.word(width); output.word(height);
  output.byte(0xf7); output.byte(0); output.byte(0);
  for (const value of palette332()) output.byte(value);
  output.byte(0x21); output.byte(0xff); output.byte(11); output.text("NETSCAPE2.0");
  output.byte(3); output.byte(1); output.word(Math.max(0, Math.min(65535, options.loop))); output.byte(0);
  for (const frame of frames) {
    output.byte(0x21); output.byte(0xf9); output.byte(4); output.byte(0x08);
    output.word(Math.max(1, Math.min(65535, Math.round(frame.delayMs / 10))));
    output.byte(0); output.byte(0);
    output.byte(0x2c); output.word(0); output.word(0); output.word(width); output.word(height); output.byte(0);
    output.byte(8);
    output.block(lzwEncode(quantize332(frame.rgba)));
  }
  output.byte(0x3b);
  return Uint8Array.from(output.values);
}

export function encodeGif(frames: GifFrame[], options: GifOptions = { loop: 0 }): Blob {
  return new Blob([encodeGifBytes(frames, options)], { type: "image/gif" });
}
