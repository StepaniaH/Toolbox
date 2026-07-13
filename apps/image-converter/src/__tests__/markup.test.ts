import { describe, expect, it } from "vitest";
import { convertMarkup, parseMarkup, renderMarkup } from "../lib/markup";

describe("text and markup conversion", () => {
  it("preserves headings, links, lists, and fenced code through Org mode", () => {
    const source = "# Guide\n\nVisit [Toolbox](https://example.com).\n\n- Fast\n- Local\n\n```ts\nconst local = true\n```";
    const { blocks, output } = convertMarkup(source, "markdown", "org");
    expect(blocks.map((block) => block.type)).toEqual(["heading", "paragraph", "list", "code"]);
    expect(output).toContain("* Guide");
    expect(output).toContain("[[https://example.com][Toolbox]]");
    expect(output).toContain("#+BEGIN_SRC ts");
  });

  it("parses reStructuredText headings and renders safe HTML", () => {
    const blocks = parseMarkup("Title\n=====\n\nA <script>alert(1)</script> paragraph.", "rst");
    const html = renderMarkup(blocks, "html");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("extracts useful structure from HTML without executable nodes", () => {
    const { output, blocks } = convertMarkup('<h2>Hello</h2><script>bad()</script><ul><li><a href="https://example.com">A</a></li><li>B</li></ul>', "html", "markdown");
    expect(blocks).toHaveLength(2);
    expect(output).toBe("## Hello\n\n- [A](https://example.com)\n- B");
  });

  it("drops active link schemes from generated HTML", () => {
    const { output } = convertMarkup("[safe](https://example.com) [bad](javascript:alert(1)) [also bad](data:text/html,boom)", "markdown", "html");
    expect(output).toContain('<a href="https://example.com">safe</a>');
    expect(output).not.toContain("javascript:");
    expect(output).not.toContain("data:text/html");
  });
});
