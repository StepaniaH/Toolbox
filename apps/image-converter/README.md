# FormTran

A private, browser-only file workspace for conversion, compression, editing, splitting, merging, encoding, parsing, and inspection. Its file home identifies inputs and recommends relevant tools before any operation runs. No source content leaves the device.

The expansion is staged. Existing image conversion, GIF composition, and text/markup conversion are available now; image editing, GIF-specific processing, PDF page tools, structured data utilities, and archive inspection are added only after their correctness and resource boundaries are tested. Recognition never implies that the current browser can fully decode or edit a format. See [the file workbench architecture](./docs/FILE_WORKBENCH.md).

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

## GIF composer

- Arrange 2–100 browser-decodable images with explicit frame ordering.
- Clear the whole frame queue or remove/reorder individual frames.
- Fit frames proportionally into a shared canvas, choose dimensions, delay, loop count, and letterbox color.
- Encode GIF89a entirely in the browser, then preview and download the result.
- The dependency-free encoder uses a fixed 3-3-2 256-color palette. It is intended for simple short animation; photographs and gradients can show banding.
- The workload is limited to 4096 pixels per side and 100 million frame-pixels to reduce tab crashes.

## Text & Markup converter

- Open or paste TXT, Markdown, Org mode, reStructuredText, AsciiDoc, and HTML.
- Open up to 100 text files into a visible batch queue, switch or remove individual documents, clear the queue, and download all converted outputs as one ZIP.
- Parse a shared block model for headings, paragraphs, lists, quotes, code blocks, rules, and common inline links, then render any supported target.
- Inspect the recognized structure, preview raw output or sandboxed HTML, copy it, or download the appropriate extension.
- Unsafe HTML elements are removed, unsafe links are not preserved, and HTML preview runs in a script-disabled sandbox.
- Dialect-specific extensions are intentionally normalized; round trips preserve the supported structure, not byte-identical source syntax.
- Source/target formats and image download delivery use keyboard-accessible theme-native menus instead of browser-dependent native select rendering.

The knowledge base uses decision rows, expandable format references, and comparison tables for image, animation, and markup choices rather than presenting every fact as an equal card.

## Privacy and network behavior

Images, previews, conversions, and ZIP files stay in browser memory and are never uploaded. The app makes no business network requests and includes no account, backend, telemetry, ads, cookies, tracking, or remote fonts. Only conversion preferences are stored in `localStorage` under `toolbox.image-converter.settings`; image bytes and filenames are not persisted.

The privacy notice sits below the active app tab. Image, GIF, text, and knowledge pages each describe their actual local data flow.

The app works offline once its static assets are available. Unsupported browser codecs fail per file without modifying the original.

## Important limits

- The image-conversion tab flattens GIF, animated WebP, and animated AVIF to the first browser-decoded frame; use the GIF composer to build a new GIF from still images.
- Canvas re-encoding normally strips EXIF, GPS, camera metadata, and most embedded color profiles.
- HDR, CMYK, wide-gamut, and high-bit-depth sources may be mapped to an ordinary browser canvas color space.
- JPEG transparency is filled with the selected background color.
- SVG scripts, event handlers, embedded HTML, and external references are removed before decoding; raw SVG is not previewed before sanitization.
- Output is capped at 16,384 pixels per side and 80 megapixels to reduce browser memory crashes.
- Actual input decoding support depends on the browser version.
- GIF composition does not preserve source animation, per-frame transparency, disposal modes, or source-specific timing.
- Markup conversion covers a practical common subset and is not a full CommonMark, Sphinx, Org Babel, or AsciiDoc processor.

## Development

```bash
pnpm --filter=@toolbox/image-converter dev
pnpm --filter=@toolbox/image-converter build
pnpm --filter=@toolbox/image-converter test
pnpm --filter=@toolbox/image-converter lint
pnpm --filter=@toolbox/image-converter test:browser
```
