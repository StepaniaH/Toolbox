# FormTran

A private, browser-only file workspace for conversion, compression, editing, splitting, merging, encoding, parsing, and inspection. Its file home identifies inputs and recommends relevant tools before any operation runs. No source content leaves the device.

The expansion is staged. Image conversion, GIF composition, text/markup conversion, lightweight PDF inspection, and bounded ZIP listing/extraction are available now; image editing, GIF-specific processing, PDF page tools, structured data utilities, and other archive formats are added only after their correctness and resource boundaries are tested. Recognition never implies that the current browser can fully decode or edit a format. See [the file workbench architecture](./docs/FILE_WORKBENCH.md).

## File home

- Accepts mixed files and folders, with a 500-file / 2 GB queue budget.
- Reads at most the first 64 KiB of each file to identify JPEG, PNG, WebP, AVIF, GIF, SVG, BMP, TIFF, HEIC, ICO, PDF, ZIP, supported text, and structured-data names.
- Prefers recognizable content signatures over extensions and warns when they disagree.
- Distinguishes ZIP-based document containers such as XLSX, DOCX, ODS, and EPUB from ordinary ZIP archives, so they are not offered to the archive extractor.
- Shows available, limited, and planned capabilities separately; no conversion or parser starts automatically.
- Can hand supported inputs into image conversion, GIF composition, text/markup conversion, PDF inspection, or ZIP inspection, and generates image Data URLs locally up to 10 MB.
- Provides editable image starting presets for web photos, transparent assets, and private sharing.

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
- A separate Knowledge Base tab covers images, animation, text markup, PDF, and archives with capability comparisons and safety boundaries.

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

## PDF and ZIP workspaces

- Users can enter PDF and Archive tabs directly or route an identified file there from File Home.
- PDF inspection reports the version, lightweight page/object estimates, encryption, linearization, metadata hints, and first media box. It reads at most 32 MB and does not claim full-parser accuracy.
- ZIP inspection is bounded to 5,000 entries, a 512 MB archive, 256 MB per expanded entry, and 1 GB expanded total.
- Selective extraction blocks unsafe paths, encryption, unknown methods, oversized entries, and suspicious ratios, then verifies output size and CRC. Multiple selections are repackaged locally.

## Privacy and network behavior

Files, identification prefixes, images, previews, conversions, parsed text, and ZIP files stay in browser memory and are never uploaded. The app makes no business network requests and includes no account, backend, telemetry, ads, cookies, tracking, or remote fonts. Only conversion preferences are stored in `localStorage` under `toolbox.image-converter.settings`; file bytes, filenames, and identification results are not persisted.

The privacy notice sits below the active app tab. Image, GIF, text, PDF, archive, and knowledge pages each describe their actual local data flow.

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
