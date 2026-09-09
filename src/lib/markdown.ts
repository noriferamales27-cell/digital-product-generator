/** Small Markdown renderer for product previews and the playbook. Covers what the prompts allow. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function render(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let inCode = false;
  let code: string[] = [];
  let para: string[] = [];
  let tableRows = 0;

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };

  for (const raw of lines) {
    if (raw.trim().startsWith("```")) {
      flushPara(); closeList();
      if (inCode) { out.push(`<pre>${esc(code.join("\n"))}</pre>`); code = []; }
      inCode = !inCode;
      continue;
    }
    if (inCode) { code.push(raw); continue; }
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); closeList(); continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushPara(); closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const check = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (check || bullet || num) {
      flushPara();
      const kind: "ul" | "ol" = num ? "ol" : "ul";
      if (list !== kind) { closeList(); out.push(`<${kind}>`); list = kind; }
      const body = check ? `${check[1].trim() ? "☑" : "☐"} ${inline(check[2])}` : inline((bullet ?? num)![1]);
      out.push(`<li>${body}</li>`);
      continue;
    }
    if (/^(---|\*\*\*)$/.test(line.trim())) { flushPara(); closeList(); out.push("<hr/>"); continue; }
    if (line.trim().startsWith("|")) {
      flushPara(); closeList();
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      const tag = tableRows === 0 ? "th" : "td";
      if (tableRows === 0) out.push('<div class="table-wrap"><table class="grid">');
      out.push(`<tr>${cells.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`);
      tableRows++;
      continue;
    } else if (tableRows > 0) { out.push("</table></div>"); tableRows = 0; }
    para.push(line.replace(/^>\s?/, ""));
  }
  if (tableRows > 0) out.push("</table></div>");
  if (inCode && code.length) out.push(`<pre>${esc(code.join("\n"))}</pre>`);
  flushPara(); closeList();
  return out.join("\n");
}
