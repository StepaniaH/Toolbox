# FormTran / 方转

A private, browser-only image conversion workspace for individual files and folders. It converts browser-decodable JPEG, PNG, WebP, GIF, BMP, AVIF, and sanitized SVG sources to PNG, JPEG, or WebP, with resize, quality, transparency background, before/after previews, guided batch rename, conflict handling, individual downloads, and ZIP export.

## Input and output

- Input: up to 500 supported images, 512 MB per file, and 2 GB total per queue.
- Output: PNG (lossless + transparency), JPEG (lossy, no transparency), or WebP (lossy + transparency).
- Resize: original dimensions, percentage, or fit within maximum width/height; optional no-upscale protection.
- Folder intake reports every skipped file and reason in an on-demand detail panel instead of silently ignoring it.
- Naming: clickable token templates or guided regular-expression replacement with presets, capture-group feedback, live per-file matching, padded sequences, portable filename sanitization, and automatic conflict suffixes.
- Folder uploads can preserve their relative directories inside the ZIP.
- Converted results appear in a gallery and open in a keyboard-navigable before/after viewer.
- Downloads can be emitted as direct files (one result directly, many separately) or as one ZIP archive.
- Upload and queue cards share the first workspace row, with immediate accepted/skipped feedback after every selection.
- A separate Knowledge Base tab includes a purpose guide, seven format references, a capability table, and conversion boundaries.

## Privacy and network behavior

Images, previews, conversions, and ZIP files stay in browser memory and are never uploaded. The app makes no business network requests and includes no account, backend, telemetry, ads, cookies, tracking, or remote fonts. Only conversion preferences are stored in `localStorage` under `toolbox.image-converter.settings`; image bytes and filenames are not persisted.

The privacy notice sits below the active app tab. The conversion tab describes in-memory file handling and local preferences; the Knowledge Base notice states that its static reference content neither reads files nor records reading behavior.

The app works offline once its static assets are available. Unsupported browser codecs fail per file without modifying the original.

## Important limits

- GIF, animated WebP, and animated AVIF are flattened to the first browser-decoded frame.
- Canvas re-encoding normally strips EXIF, GPS, camera metadata, and most embedded color profiles.
- HDR, CMYK, wide-gamut, and high-bit-depth sources may be mapped to an ordinary browser canvas color space.
- JPEG transparency is filled with the selected background color.
- SVG scripts, event handlers, embedded HTML, and external references are removed before decoding; raw SVG is not previewed before sanitization.
- Output is capped at 16,384 pixels per side and 80 megapixels to reduce browser memory crashes.
- Actual input decoding support depends on the browser version.

## Development

```bash
pnpm --filter=@toolbox/image-converter dev
pnpm --filter=@toolbox/image-converter build
pnpm --filter=@toolbox/image-converter test
pnpm --filter=@toolbox/image-converter lint
pnpm --filter=@toolbox/image-converter test:browser
```
