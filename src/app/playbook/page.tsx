import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { render } from "@/lib/markdown";

export const dynamic = "force-static";

export default function PlaybookPage() {
  const file = path.join(process.cwd(), "docs", "playbook.md");
  const md = fs.readFileSync(file, "utf8");
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="wordmark"><span className="n">Norie</span><span className="d">Digi</span> <span style={{ color: "#475569", fontSize: 16 }}>Playbook</span></div>
          <div className="hint">How the winners sell, where to sell, and how to sell.</div>
        </div>
        <div className="right"><Link className="btn btn-primary btn-sm" href="/">Open the generator</Link></div>
      </header>
      <article className="card md" style={{ maxWidth: 860 }} dangerouslySetInnerHTML={{ __html: render(md) }} />
    </div>
  );
}
