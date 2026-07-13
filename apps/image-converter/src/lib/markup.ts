export type MarkupFormat = "txt" | "markdown" | "org" | "rst" | "asciidoc" | "html";
export type MarkupBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; text: string }
  | { type: "quote"; text: string }
  | { type: "rule" };

export const MARKUP_EXTENSIONS: Record<MarkupFormat, string> = {
  txt: "txt", markdown: "md", org: "org", rst: "rst", asciidoc: "adoc", html: "html",
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function normalizeInline(value: string, source: MarkupFormat): string {
  if (source === "org") return value.replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g, "[$2]($1)");
  if (source === "rst") return value.replace(/`([^`<]+)\s*<([^>]+)>`_/g, "[$1]($2)");
  if (source === "asciidoc") return value.replace(/(?:link:)?(https?:[^[]+)\[([^\]]+)\]/g, "[$2]($1)");
  return value;
}

function plainInline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`]+/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function inline(value: string, target: MarkupFormat): string {
  if (target === "txt") return plainInline(value);
  if (target === "markdown") return value;
  if (target === "org") return value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[[$2][$1]]");
  if (target === "rst") return value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "`$1 <$2>`_");
  if (target === "asciidoc") return value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$2[$1]");
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function htmlInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof Element)) return "";
  const content = [...node.childNodes].map(htmlInline).join("");
  const tag = node.tagName.toLowerCase();
  if (tag === "strong" || tag === "b") return `**${content}**`;
  if (tag === "em" || tag === "i") return `*${content}*`;
  if (tag === "code") return `\`${content}\``;
  if (tag === "br") return "\n";
  if (tag === "a") {
    const href = node.getAttribute("href")?.trim() ?? "";
    return /^(?:https?:|mailto:|#)/i.test(href) ? `[${content}](${href})` : content;
  }
  return content;
}

function parseHtml(input: string): MarkupBlock[] {
  const documentNode = new DOMParser().parseFromString(input, "text/html");
  for (const unsafe of documentNode.querySelectorAll("script, style, iframe, object, embed, template")) unsafe.remove();
  const blocks: MarkupBlock[] = [];
  const nodes = documentNode.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,ul,ol,pre,blockquote,hr");
  for (const node of nodes) {
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) blocks.push({ type: "heading", level: Number(tag[1]), text: htmlInline(node).trim() });
    else if (tag === "p") blocks.push({ type: "paragraph", text: htmlInline(node).trim() });
    else if (tag === "ul" || tag === "ol") blocks.push({ type: "list", ordered: tag === "ol", items: [...node.children].map((item) => htmlInline(item).trim()) });
    else if (tag === "pre") blocks.push({ type: "code", language: node.querySelector("code")?.className.replace(/^language-/, "") ?? "", text: node.textContent ?? "" });
    else if (tag === "blockquote") blocks.push({ type: "quote", text: htmlInline(node).trim() });
    else blocks.push({ type: "rule" });
  }
  if (!blocks.length && documentNode.body.textContent?.trim()) blocks.push({ type: "paragraph", text: documentNode.body.textContent.trim() });
  return blocks;
}

export function parseMarkup(input: string, source: MarkupFormat): MarkupBlock[] {
  if (!input.trim()) return [];
  if (source === "html") return parseHtml(input);
  if (source === "txt") return input.trim().split(/\n\s*\n/).map((text) => ({ type: "paragraph", text: text.replace(/\s*\n\s*/g, " ") }));
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkupBlock[] = [];
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: normalizeInline(paragraph.join(" ").trim(), source) });
    paragraph = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) { flushParagraph(); continue; }
    if (source === "rst" && index + 1 < lines.length && /^(=+|-+|~+|\^+)$/.test(lines[index + 1].trim()) && lines[index + 1].trim().length >= line.trim().length) {
      flushParagraph();
      const marker = lines[++index].trim()[0];
      blocks.push({ type: "heading", level: marker === "=" ? 1 : marker === "-" ? 2 : marker === "~" ? 3 : 4, text: normalizeInline(line.trim(), source) });
      continue;
    }
    const heading = source === "org" ? /^(\*{1,6})\s+(.+)$/.exec(line) : source === "asciidoc" ? /^(={1,6})\s+(.+)$/.exec(line) : /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) { flushParagraph(); blocks.push({ type: "heading", level: heading[1].length, text: normalizeInline(heading[2], source) }); continue; }
    const fence = source === "org" ? /^#\+BEGIN_SRC\s*(.*)$/i.exec(line) : source === "rst" ? /^\.\.\s+code-block::\s*(.*)$/.exec(line) : source === "asciidoc" ? /^\[source(?:,([^\]]+))?\]$/.exec(line) : null;
    if (fence || (source === "markdown" && /^```(.*)$/.test(line))) {
      flushParagraph();
      const language = fence?.[1]?.trim() ?? line.replace(/^```/, "").trim();
      const endPattern = source === "org" ? /^#\+END_SRC/i : source === "rst" ? /^\S/ : source === "asciidoc" ? /^----$/ : /^```/;
      if (source === "asciidoc" && lines[index + 1]?.trim() === "----") index += 1;
      const code: string[] = [];
      while (++index < lines.length && !endPattern.test(lines[index])) code.push(source === "rst" ? lines[index].replace(/^\s{2,4}/, "") : lines[index]);
      blocks.push({ type: "code", language, text: code.join("\n") });
      continue;
    }
    const list = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/.exec(line);
    if (list) {
      flushParagraph();
      const ordered = /^\d/.test(list[2]);
      const items = [normalizeInline(list[3], source)];
      while (index + 1 < lines.length) {
        const next = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/.exec(lines[index + 1]);
        if (!next || /^\d/.test(next[2]) !== ordered) break;
        items.push(normalizeInline(next[3], source)); index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (/^>\s?/.test(line)) { flushParagraph(); blocks.push({ type: "quote", text: normalizeInline(line.replace(/^>\s?/, ""), source) }); continue; }
    if (/^(---+|\*\*\*+|___+)$/.test(line.trim())) { flushParagraph(); blocks.push({ type: "rule" }); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph();
  return blocks;
}

export function renderMarkup(blocks: MarkupBlock[], target: MarkupFormat): string {
  if (target === "html") return blocks.map((block) => {
    if (block.type === "heading") return `<h${block.level}>${inline(block.text, target)}</h${block.level}>`;
    if (block.type === "paragraph") return `<p>${inline(block.text, target)}</p>`;
    if (block.type === "list") { const tag = block.ordered ? "ol" : "ul"; return `<${tag}>${block.items.map((item) => `<li>${inline(item, target)}</li>`).join("")}</${tag}>`; }
    if (block.type === "code") return `<pre><code${block.language ? ` class="language-${escapeHtml(block.language)}"` : ""}>${escapeHtml(block.text)}</code></pre>`;
    if (block.type === "quote") return `<blockquote>${inline(block.text, target)}</blockquote>`;
    return "<hr>";
  }).join("\n");
  return blocks.map((block) => {
    if (block.type === "heading") {
      if (target === "txt") return plainInline(block.text).toUpperCase();
      if (target === "rst") { const text = inline(block.text, target); return `${text}\n${"=-~^"[Math.min(3, block.level - 1)].repeat(text.length)}`; }
      return `${target === "org" ? "*" : target === "asciidoc" ? "=" : "#".repeat(block.level)}${target === "org" || target === "asciidoc" ? (target === "org" ? "*".repeat(block.level - 1) : "=".repeat(block.level - 1)) : ""} ${inline(block.text, target)}`;
    }
    if (block.type === "paragraph") return inline(block.text, target);
    if (block.type === "list") return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${inline(item, target)}`).join("\n");
    if (block.type === "quote") return target === "txt" ? `“${plainInline(block.text)}”` : `> ${inline(block.text, target)}`;
    if (block.type === "rule") return target === "txt" ? "────────" : "---";
    if (target === "txt") return block.text;
    if (target === "org") return `#+BEGIN_SRC ${block.language}\n${block.text}\n#+END_SRC`;
    if (target === "rst") return `.. code-block:: ${block.language}\n\n${block.text.split("\n").map((line) => `   ${line}`).join("\n")}`;
    if (target === "asciidoc") return `[source${block.language ? `,${block.language}` : ""}]\n----\n${block.text}\n----`;
    return `\`\`\`${block.language}\n${block.text}\n\`\`\``;
  }).join("\n\n");
}

export function convertMarkup(input: string, source: MarkupFormat, target: MarkupFormat): { output: string; blocks: MarkupBlock[] } {
  const blocks = parseMarkup(input, source);
  return { blocks, output: renderMarkup(blocks, target) };
}
