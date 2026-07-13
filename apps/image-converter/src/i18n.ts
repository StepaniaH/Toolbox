import type { Translations } from "@toolbox/i18n/core";

export const translations: Record<"zh" | "en", Translations> = {
  zh: {
    meta: { title: "图片格式转换 · Toolbox", description: "在浏览器本地批量转换图片格式、尺寸和文件名" },
    brand: { title: "图片格式转换", subtitle: "格式、尺寸和文件名都在你的浏览器里完成" },
    privacy: { title: "图片不会上传", detail: "转换、预览、批量命名和 ZIP 打包全部在当前设备完成。关闭页面后不会保留图片。" },
    upload: {
      title: "添加图片", drop: "拖放图片到这里", hint: "或选择单张、多张、整个文件夹；最多 500 个文件，总计 2 GB",
      files: "选择图片", folder: "选择文件夹", accepted: "输入：JPEG、PNG、WebP、GIF、BMP、AVIF、SVG",
      rejected: "部分文件未加入：仅支持主流图片格式，且单文件不能超过 512 MB。", limit: "文件数量或总大小超过本地安全上限。",
    },
    settings: {
      title: "转换设置", format: "输出格式", quality: "画质", qualityTip: "JPEG/WebP 的编码质量。越高通常体积越大；PNG 是无损格式，不使用此项。",
      resize: "调整尺寸", original: "保持原尺寸", scale: "按百分比", fit: "限制最大宽高", percent: "缩放比例",
      maxWidth: "最大宽度", maxHeight: "最大高度", noUpscale: "不放大小图", background: "JPEG 透明区域底色",
      backgroundTip: "JPEG 不支持透明。透明像素会先铺上此颜色，避免默认变黑。", keepSmaller: "同格式且重编码更大时保留原文件",
      preserveFolders: "ZIP 中保留文件夹结构", reset: "恢复默认设置",
    },
    rename: {
      title: "可视化批量命名", mode: "命名方式", templateMode: "模板", regexMode: "正则替换", template: "文件名模板",
      tokens: "可用变量：{name} {index} {format} {width} {height}", pattern: "匹配正则", replacement: "替换内容",
      replacementTip: "支持 $1 等捕获组，也可以在替换内容中使用变量。例如匹配 ^IMG_(.*)$，替换为 photo-$1-{index}。",
      global: "替换全部匹配", ignoreCase: "忽略大小写", start: "序号起点", padding: "序号位数", preview: "名称预览",
      invalid: "正则表达式无效，请检查括号、转义和量词。", empty: "命名规则不能为空。", conflict: "重名文件会自动追加 -2、-3。",
    },
    queue: {
      title: "文件队列", count: "{{count}} 个文件", empty: "添加图片后，这里会显示预览、尺寸、状态和输出体积。",
      clear: "清空", remove: "移除", source: "原图", output: "输出", ready: "等待转换", converting: "转换中", done: "已完成",
      kept: "保留较小原文件", error: "转换失败", download: "下载", firstFrame: "动图仅转换第一帧", svgSafe: "SVG 会先移除脚本和外部引用",
      unknownSize: "转换后显示尺寸", previewUnavailable: "此格式转换前不直接预览", progress: "已完成 {{done}} / {{total}}",
    },
    actions: { convert: "开始转换", stop: "完成当前项后停止", downloadZip: "下载 ZIP", converting: "正在转换…", nothing: "请先添加图片", fixRename: "请先修正命名规则" },
    errors: {
      "decode-failed": "浏览器无法解码此图片，文件可能损坏或当前浏览器不支持。", "image-too-large": "输出尺寸超过浏览器安全上限（最长边 16384 px 或 8000 万像素）。",
      "encode-unsupported": "当前浏览器不支持编码为所选格式。", "canvas-unavailable": "浏览器无法创建图片画布。", unknown: "转换时发生未知错误。",
    },
    knowledge: {
      title: "格式知识与边界", intro: "选择格式前，先看最容易影响结果的几件事。", jpeg: "JPEG：照片兼容性好、体积小，但有损且不支持透明。重复保存会继续损失细节。",
      png: "PNG：无损并支持透明，适合图标、截图和文字；照片通常会明显更大。", webp: "WebP：同时支持有损、无损和透明，网页场景通常更省空间；旧软件兼容性弱于 JPEG/PNG。",
      animation: "GIF / 动态 WebP / 动态 AVIF：当前版本只取浏览器解码的第一帧，不保留动画。", metadata: "Canvas 重编码通常会移除 EXIF、GPS、相机信息和大多数色彩配置；这有利于隐私，但不适合需要保留摄影元数据的流程。",
      color: "HDR、广色域、CMYK 和 16-bit 图像可能被浏览器转换到普通屏幕色域或 8-bit。重要印刷素材应使用专业软件复核。",
      browser: "输入格式是否可解码取决于浏览器版本。AVIF/BMP 等格式若失败，会保留原文件并显示错误，不会上传到服务器。",
    },
  },
  en: {
    meta: { title: "Image Converter · Toolbox", description: "Convert image formats, dimensions, and filenames locally in your browser" },
    brand: { title: "Image Converter", subtitle: "Formats, dimensions, and filenames—processed only in your browser" },
    privacy: { title: "Your images are never uploaded", detail: "Conversion, previews, batch naming, and ZIP packaging happen on this device. Images are not retained after you close the page." },
    upload: {
      title: "Add images", drop: "Drop images here", hint: "Or choose one, many, or a folder; up to 500 files and 2 GB total",
      files: "Choose images", folder: "Choose folder", accepted: "Input: JPEG, PNG, WebP, GIF, BMP, AVIF, SVG",
      rejected: "Some files were skipped. Only supported images under 512 MB each can be added.", limit: "The file count or total size exceeds the local safety limit.",
    },
    settings: {
      title: "Conversion settings", format: "Output format", quality: "Quality", qualityTip: "JPEG/WebP encoding quality. Higher values are usually larger. PNG is lossless and ignores this option.",
      resize: "Resize", original: "Original dimensions", scale: "Percentage", fit: "Fit within bounds", percent: "Scale",
      maxWidth: "Maximum width", maxHeight: "Maximum height", noUpscale: "Do not enlarge small images", background: "JPEG transparency background",
      backgroundTip: "JPEG has no transparency. Transparent pixels are filled with this color instead of turning black.", keepSmaller: "Keep the original when same-format encoding is larger",
      preserveFolders: "Preserve folder structure in ZIP", reset: "Reset settings",
    },
    rename: {
      title: "Visual batch naming", mode: "Naming mode", templateMode: "Template", regexMode: "Regex replace", template: "Filename template",
      tokens: "Tokens: {name} {index} {format} {width} {height}", pattern: "Match pattern", replacement: "Replacement",
      replacementTip: "Capture groups such as $1 and tokens are supported. Example: match ^IMG_(.*)$ and replace with photo-$1-{index}.",
      global: "Replace every match", ignoreCase: "Ignore case", start: "Sequence starts at", padding: "Sequence width", preview: "Name preview",
      invalid: "Invalid regular expression. Check groups, escaping, and quantifiers.", empty: "Naming rules cannot be empty.", conflict: "Duplicate names automatically receive -2, -3, and so on.",
    },
    queue: {
      title: "File queue", count: "{{count}} files", empty: "Add images to see previews, dimensions, status, and output size here.",
      clear: "Clear", remove: "Remove", source: "Source", output: "Output", ready: "Ready", converting: "Converting", done: "Done",
      kept: "Kept smaller original", error: "Conversion failed", download: "Download", firstFrame: "Animation is flattened to its first frame", svgSafe: "Scripts and external SVG references are removed",
      unknownSize: "Dimensions appear after conversion", previewUnavailable: "No raw preview for this format", progress: "Completed {{done}} / {{total}}",
    },
    actions: { convert: "Convert images", stop: "Stop after current image", downloadZip: "Download ZIP", converting: "Converting…", nothing: "Add images first", fixRename: "Fix the naming rule first" },
    errors: {
      "decode-failed": "The browser cannot decode this image. It may be damaged or unsupported here.", "image-too-large": "Output exceeds the browser safety limit (16384 px per side or 80 megapixels).",
      "encode-unsupported": "This browser cannot encode the selected format.", "canvas-unavailable": "The browser could not create an image canvas.", unknown: "An unknown conversion error occurred.",
    },
    knowledge: {
      title: "Format notes and limits", intro: "A few details matter before choosing a format.", jpeg: "JPEG: broadly compatible and compact for photos, but lossy and without transparency. Repeated saves lose more detail.",
      png: "PNG: lossless with transparency, ideal for icons, screenshots, and text. Photos are usually much larger.", webp: "WebP: supports lossy, lossless, and transparency and is often smaller on the web, but older software has weaker support.",
      animation: "GIF / animated WebP / animated AVIF: this version converts only the first decoded frame and does not preserve animation.", metadata: "Canvas re-encoding usually strips EXIF, GPS, camera details, and most color profiles. That improves privacy but is unsuitable when metadata must be preserved.",
      color: "HDR, wide-gamut, CMYK, and 16-bit images may be mapped to a standard display gamut or 8-bit. Verify important print assets in professional software.",
      browser: "Input decoding depends on the browser version. If AVIF, BMP, or another source fails, the original stays untouched and nothing is uploaded.",
    },
  },
};
