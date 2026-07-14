# FormTran

A private, browser-only file workspace for conversion, compression, editing, splitting, merging, encoding, parsing, and inspection. Its file home identifies inputs and recommends relevant tools before any operation runs. No source content leaves the device.

The expansion is staged. Image conversion (including local HEIC/HEIF decoding), GIF composition, text/markup conversion, CSV/TSV/XLSX table conversion, bounded PDF page operations, and bounded ZIP listing/extraction are available now. Image editing, GIF-specific processing, visual PDF rendering, and other archive formats stay closed until their own correctness and resource boundaries pass review. Recognition never implies that the current browser can fully decode or edit a format. See [the file workbench architecture](./docs/FILE_WORKBENCH.md).

## File home

- Presents one intake surface for mixed files and folders, with a 500-file / 2 GB queue budget. The single “Add content” control reveals native file/folder choices only because browsers cannot combine them in one picker; drag-and-drop walks folders recursively.
- Reads at most the first 64 KiB of each file to identify JPEG, PNG, WebP, AVIF, GIF, SVG, BMP, TIFF, HEIC/HEIF, ICO, PDF, ZIP, supported text, and structured-data names.
- Prefers recognizable content signatures over extensions and warns when they disagree.
- Distinguishes ZIP-based document containers such as XLSX, DOCX, ODS, and EPUB from ordinary ZIP archives, so they are not offered to the archive extractor.
- Groups the queue by file family and supports current-item, checked-item, whole-family, and all-item selection without flattening the page into a card wall.
- Shows available, limited, and planned capabilities separately; no conversion or parser starts automatically.
- Can hand compatible selection scopes into image conversion, GIF composition, text/markup conversion, table data, PDF page tools, or ZIP inspection, and generates image Data URLs locally up to 10 MB.
- Provides a live task overview plus a separate item dialog. Safe raster images and bounded text are previewed directly; PDF, archives, SVG, HEIC, and other active formats remain metadata-only until opened in their dedicated workspace.
- Keeps the home task in memory while a dedicated workspace is open and returns newly generated image, GIF, text, table, PDF, and extracted ZIP outputs to one shared result queue.
- Groups results by family and supports individual, checked, same-family, or all-result scope. Users can rename one result, apply `{name}` / `{index}` / `{family}` templates in bulk, preview safe raster or bounded text output, remove results, download up to 10 files directly, or export one family-grouped ZIP.
- Keeps result blobs only by in-memory reference: no duplicate persistence or upload. The queue is capped at 200 results / 1 GB, and unified ZIP input at 512 MB; closing the page clears the task.
- Provides editable image starting presets for web photos, transparent assets, and private sharing.

## Input and output

- Input: up to 500 supported images, 512 MB per file, and 2 GB total per queue; HEIC/HEIF decoding has a separate 64 MB input limit.
- Output: PNG (lossless + transparency), JPEG (lossy, no transparency), or WebP (lossy + transparency).
- HEIC/HEIF first uses native browser decoding and then a local Apache-2.0 WASM fallback. The roughly 960 KB raw decoder is loaded only for HEIC/HEIF and is served with the app rather than fetched from a third-party CDN.
- Resize: original dimensions, percentage, or fit within maximum width/height; optional no-upscale protection.
- Transform: batch rotation at 0°/90°/180°/270° plus horizontal and vertical flips in the final output orientation.
- Image information: decoded pixel dimensions, pixel count, aspect ratio, browser MIME type, and file size are available from the queue before conversion for safely previewable raster inputs.
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
- Open up to 100 text files into a visible batch queue, switch or remove individual documents, clear the queue, and add one or all converted outputs to the shared task results.
- Parse a shared block model for headings, paragraphs, lists, quotes, code blocks, rules, and common inline links, then render any supported target.
- Inspect the recognized structure, preview raw output or sandboxed HTML, copy it, or download the appropriate extension.
- Unsafe HTML elements are removed, unsafe links are not preserved, and HTML preview runs in a script-disabled sandbox.
- Dialect-specific extensions are intentionally normalized; round trips preserve the supported structure, not byte-identical source syntax.
- Source/target formats and image download delivery use keyboard-accessible theme-native menus instead of browser-dependent native select rendering.

The knowledge base uses decision rows, expandable format references, and comparison tables for image, animation, and markup choices rather than presenting every fact as an equal card.

## Table data converter

- CSV/TSV is read as UTF-8 with standard quoting and delimiter detection; XLSX is read as a workbook instead of being sent to the ordinary ZIP extractor.
- CSV/TSV can export CSV, TSV, JSON, or a macro-free single-sheet XLSX. XLSX can export CSV, TSV, or JSON.
- XLSX reads cell values and cached formula values only. It never runs formulas, macros, or external links and does not preserve date formatting, styles, charts, merged cells, or formulas.
- CSV/TSV export protects against spreadsheet formula injection by default, with an explicit opt-out. JSON can use a de-duplicated first row as field names.
- Limits are 16 MB for CSV/TSV, 32 MB for XLSX, 20,000 rows, 256 columns, 250,000 cells, and 32,767 characters per cell. Preview shows 50 rows by 20 columns while export uses all accepted data.

## PDF and ZIP workspaces

- Users can enter PDF and Archive tabs directly or route an identified file there from File Home.
- PDF uses the MIT-licensed `pdf-lib` 1.17.1 only after the PDF workspace is opened. Its roughly 408 KB raw / 131 KB gzip parser-writer chunk does not enter the home startup path.
- Parsed PDFs report an exact page count and can be merged in queue order, split into one-page PDFs, extracted, removed, reordered with a complete page list, or rotated by 90°/180°/270°. Every operation produces a new file and leaves sources untouched.
- PDF budgets are 20 files, 32 MB per file, 128 MB total merge input, and 500 pages. Per-page ZIP splitting is limited to 50 pages and 256 MB of generated output. Encrypted/password-protected PDFs are rejected.
- Page copying is not sanitization: annotations, links, and page actions may remain, while digital signatures, forms, outlines, and document-level attachments can break or be omitted. Thumbnail rendering and PDF-to-image remain unavailable pending a separate renderer and pixel-memory budget.
- ZIP inspection is bounded to 5,000 entries, a 512 MB archive, 256 MB per expanded entry, and 1 GB expanded total.
- Selective extraction blocks unsafe or duplicate paths, encryption, unknown methods, oversized entries, and suspicious ratios. Deflate output is stopped as soon as it exceeds the declared size, selected entries are expanded sequentially, and final size plus CRC are verified before the verified files enter the shared result queue.

## Privacy and network behavior

Files, identification prefixes, images, previews, conversions, parsed text, tables, PDFs, and ZIP files stay in browser memory and are never uploaded. The app makes no business network requests and includes no account, backend, telemetry, ads, cookies, tracking, or remote fonts. Only conversion preferences are stored in `localStorage` under `toolbox.image-converter.settings`; file bytes, filenames, and identification results are not persisted.

The privacy notice sits below the active app tab. Image, GIF, text, PDF, archive, and knowledge pages each describe their actual local data flow.

The app works offline once its static assets are available. Unsupported browser codecs fail per file without modifying the original.

## Important limits

- The image-conversion tab flattens GIF, animated WebP, and animated AVIF to the first browser-decoded frame; use the GIF composer to build a new GIF from still images.
- Canvas re-encoding normally strips EXIF, GPS, camera metadata, and most embedded color profiles.
- HDR, CMYK, wide-gamut, and high-bit-depth sources may be mapped to an ordinary browser canvas color space.
- JPEG transparency is filled with the selected background color.
- SVG scripts, event handlers, embedded HTML, and external references are removed before decoding; raw SVG is not previewed before sanitization.
- Output is capped at 16,384 pixels per side and 80 megapixels to reduce browser memory crashes.
- Native input decoding depends on the browser version; HEIC/HEIF also has a local WASM fallback shipped with the static app.
- A rotated or flipped image is always re-encoded; FormTran never substitutes an unchanged smaller original for a requested transform.
- GIF composition does not preserve source animation, per-frame transparency, disposal modes, or source-specific timing.
- Markup conversion covers a practical common subset and is not a full CommonMark, Sphinx, Org Babel, or AsciiDoc processor.
- Table conversion targets safe, inspectable values rather than Excel fidelity; it does not retain macros, formula logic, or workbook presentation.
- PDF operations copy pages into new documents rather than editing sources. They are not a renderer, sanitizer, signature-preserving editor, or high-fidelity form/outlines workflow.

## Development

```bash
pnpm --filter=@toolbox/image-converter dev
pnpm --filter=@toolbox/image-converter build
pnpm --filter=@toolbox/image-converter test
pnpm --filter=@toolbox/image-converter lint
pnpm --filter=@toolbox/image-converter test:browser
```
