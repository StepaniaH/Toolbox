# Image Converter

A private, browser-only image conversion workspace for individual files and folders. It converts browser-decodable JPEG, PNG, WebP, GIF, BMP, AVIF, and sanitized SVG sources to PNG, JPEG, or WebP, with resize, quality, transparency background, preview, batch rename, conflict handling, individual downloads, and ZIP export.

## Input and output

- Input: up to 500 supported images, 512 MB per file, and 2 GB total per queue.
- Output: PNG (lossless + transparency), JPEG (lossy, no transparency), or WebP (lossy + transparency).
- Resize: original dimensions, percentage, or fit within maximum width/height; optional no-upscale protection.
- Naming: token templates or regular-expression replacement with capture groups, live preview, padded sequences, portable filename sanitization, and automatic conflict suffixes.
- Folder uploads can preserve their relative directories inside the ZIP.

## Privacy and network behavior

Images, previews, conversions, and ZIP files stay in browser memory and are never uploaded. The app makes no business network requests and includes no account, backend, telemetry, ads, cookies, tracking, or remote fonts. Only conversion preferences are stored in `localStorage` under `toolbox.image-converter.settings`; image bytes and filenames are not persisted.

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
