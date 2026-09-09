import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

/**
 * Converts the generator's Markdown into a .docx buffer. Handles headings,
 * bullets, numbered lists, checklists, code blocks, bold and italic. That is
 * everything the product prompt is allowed to produce.
 */
export async function markdownToDocx(title: string, author: string, markdown: string): Promise<Buffer> {
  const children: Paragraph[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushCode = () => {
    if (!codeBuffer.length) return;
    for (const l of codeBuffer) {
      children.push(new Paragraph({ children: [new TextRun({ text: l || " ", font: "Consolas", size: 20 })], spacing: { after: 0 }, shading: { fill: "F1F5F9" } }));
    }
    children.push(new Paragraph({ text: "" }));
    codeBuffer = [];
  };

  for (const raw of lines) {
    if (raw.trim().startsWith("```")) {
      if (inCode) flushCode();
      inCode = !inCode;
      continue;
    }
    if (inCode) { codeBuffer.push(raw); continue; }

    const line = raw.trimEnd();
    if (!line.trim()) { children.push(new Paragraph({ text: "" })); continue; }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][h[1].length - 1];
      children.push(new Paragraph({ heading: level, children: inline(h[2]), spacing: { before: 240, after: 120 } }));
      continue;
    }
    const check = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (check) {
      children.push(new Paragraph({ children: [new TextRun({ text: check[1].trim() ? "☑ " : "☐ " }), ...inline(check[2])], indent: { left: 360 } }));
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      children.push(new Paragraph({ children: inline(bullet[1]), bullet: { level: Math.min(2, Math.floor((raw.length - raw.trimStart().length) / 2)) } }));
      continue;
    }
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (num) {
      children.push(new Paragraph({ children: inline(num[1]), numbering: { reference: "numbers", level: 0 } }));
      continue;
    }
    if (/^(---|\*\*\*)$/.test(line.trim())) { children.push(new Paragraph({ text: "", border: { bottom: { color: "CBD5E1", size: 6, style: "single", space: 1 } } })); continue; }
    children.push(new Paragraph({ children: inline(line.replace(/^>\s?/, "")), spacing: { after: 120 } }));
  }
  if (inCode) flushCode();

  const doc = new Document({
    creator: author || "Digital Product Generator",
    title,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 40, font: "Georgia", color: "5A189A" } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, font: "Georgia", color: "0D1B2A" } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, font: "Georgia", color: "0D1B2A" } },
        { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: "0D1B2A" } },
      ],
    },
    numbering: { config: [{ reference: "numbers", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

function inline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) runs.push(new TextRun(text.slice(last, m.index)));
    const tok = m[0];
    if (tok.startsWith("**")) runs.push(new TextRun({ text: tok.slice(2, -2), bold: true }));
    else if (tok.startsWith("`")) runs.push(new TextRun({ text: tok.slice(1, -1), font: "Consolas" }));
    else runs.push(new TextRun({ text: tok.slice(1, -1), italics: true }));
    last = m.index! + tok.length;
  }
  if (last < text.length) runs.push(new TextRun(text.slice(last)));
  return runs;
}
