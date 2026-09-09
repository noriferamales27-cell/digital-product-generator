"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "./Markdown";
import { downloadDocx, downloadText, slug, streamStage } from "@/lib/stream-client";
import type { AudienceResult, LaunchResult, Opportunity, ResearchResult } from "@/lib/schemas";
import { PLATFORMS, platformByName } from "@/lib/platforms";

type Step = 1 | 2 | 3;

type Run = {
  id: string;
  createdAt: number;
  mode: "category" | "trending";
  category: string;
  audienceHint: string;
  region: string;
  notes: string;
  research?: ResearchResult;
  selected?: Opportunity;
  audience?: AudienceResult;
  product?: { title: string; markdown: string };
  launch?: LaunchResult;
  publishOn?: string;
  author: string;
  voice: string;
  length: "short" | "standard" | "long";
  goal: number;
};

type LogLine = { kind: "q" | "s" | "e"; text: string };

const QUICK_STARTS: { label: string; category: string; audience: string; region: string }[] = [
  { label: "HR templates for SMEs", category: "HR templates for small businesses (offer letters, onboarding, scorecards)", audience: "Owners of 10 to 100 person companies without an HR manager", region: "UAE and global" },
  { label: "VA starter kit", category: "Starter kit for new virtual assistants (proposals, profiles, client emails)", audience: "Filipino virtual assistants getting international clients", region: "Philippines" },
  { label: "AI prompt packs for ops", category: "AI prompt packs for business operations and admin", audience: "Small business owners and operators", region: "global" },
  { label: "Lead trackers and CRMs", category: "Lightweight CRM and lead tracker templates", audience: "Solo consultants and coaches", region: "global" },
  { label: "SOP and process templates", category: "SOP and standard operating procedure templates", audience: "Growing service businesses", region: "global" },
  { label: "Planners and printables", category: "Printable planners and trackers", audience: "Busy professionals and parents", region: "global" },
];

const STORAGE = "dpg.runs.v2";
const PASS = "dpg.password";

const newRun = (): Run => ({
  id: Math.random().toString(36).slice(2, 10),
  createdAt: Date.now(),
  mode: "trending",
  category: "",
  audienceHint: "",
  region: "global",
  notes: "",
  author: "",
  voice: "",
  length: "standard",
  goal: 500,
});

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function Generator() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [run, setRun] = useState<Run>(newRun);
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState("");
  const [autopilot, setAutopilot] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [status, setStatus] = useState<{ mock: boolean; passwordRequired: boolean } | null>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRuns(load<Run[]>(STORAGE, []));
    setPassword(load<string>(PASS, ""));
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(PASS, JSON.stringify(password)); } catch {}
  }, [password]);

  const save = (next: Run) => {
    setRun(next);
    setRuns((prev) => {
      const list = [next, ...prev.filter((r) => r.id !== next.id)].slice(0, 30);
      try { localStorage.setItem(STORAGE, JSON.stringify(list)); } catch {}
      return list;
    });
  };

  const removeRun = (id: string) => {
    setRuns((prev) => {
      const list = prev.filter((r) => r.id !== id);
      try { localStorage.setItem(STORAGE, JSON.stringify(list)); } catch {}
      return list;
    });
    if (run.id === id) { setRun(newRun()); setStep(1); }
  };

  const push = (line: LogLine) => setLog((l) => [...l.slice(-80), line]);

  async function runStep<T>(path: string, body: unknown, onDelta?: (t: string) => void): Promise<T> {
    setBusy(true); setError(""); setLog([]);
    try {
      let result: T | undefined;
      for await (const ev of streamStage(path, body, password)) {
        if (ev.type === "search") push({ kind: "q", text: ev.query });
        else if (ev.type === "status") push({ kind: "s", text: ev.text });
        else if (ev.type === "delta") onDelta?.(ev.text);
        else if (ev.type === "result") result = ev.data as T;
      }
      if (result === undefined) throw new Error("The run ended without a result.");
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg); push({ kind: "e", text: msg });
      throw e;
    } finally {
      setBusy(false);
    }
  }

  const doResearch = async (base: Run = run): Promise<Run | null> => {
    if (base.mode === "category" && !base.category.trim()) { setError("Type a category first, or search top products instead."); return null; }
    try {
      const research = await runStep<ResearchResult>("/api/research", {
        mode: base.mode, category: base.category, audience: base.audienceHint, region: base.region, notes: base.notes,
      });
      const next = { ...base, research, selected: undefined, audience: undefined, product: undefined, launch: undefined, publishOn: undefined };
      save(next);
      return next;
    } catch { return null; }
  };

  const doGenerate = async (base: Run = run): Promise<Run | null> => {
    if (!base.selected) return null;
    setDraft("");
    let acc = "";
    try {
      const out = await runStep<{ markdown: string }>("/api/generate", {
        opportunity: base.selected, audience: base.audience, length: base.length, voice: base.voice, author: base.author,
      }, (t) => { acc += t; setDraft(acc); draftRef.current?.scrollTo({ top: draftRef.current.scrollHeight }); });
      const title = out.markdown.match(/^#\s+(.*)$/m)?.[1]?.trim() || base.selected.name;
      const next = { ...base, product: { title, markdown: out.markdown } };
      save(next);
      setDraft("");
      return next;
    } catch { return null; }
  };

  /** Step 3 in one click: find the buyers, then build the launch kit with platform advice. */
  const doPublish = async (base: Run = run): Promise<Run | null> => {
    if (!base.selected || !base.product) return null;
    let cur = base;
    try {
      const audience = await runStep<AudienceResult>("/api/audience", { opportunity: cur.selected, region: cur.region });
      cur = { ...cur, audience };
      save(cur);
      const outline = cur.product!.markdown.split("\n").filter((l) => /^#{1,3}\s/.test(l) || /^-\s/.test(l)).slice(0, 60).join("\n");
      const launch = await runStep<LaunchResult>("/api/launch", {
        opportunity: cur.selected, audience: cur.audience, product_title: cur.product!.title, product_outline: outline || cur.product!.markdown.slice(0, 3000), brand: cur.author,
      });
      const suggested = suggestPlatform(launch);
      cur = { ...cur, launch, publishOn: cur.publishOn ?? suggested };
      save(cur);
      return cur;
    } catch { return null; }
  };

  /** One click: search, pick the top score, create, publish. */
  const doAutopilot = async () => {
    setAutopilot(true);
    try {
      let cur = await doResearch(run);
      if (!cur?.research) return;
      const top = cur.research.opportunities.slice().sort((a, b) => b.ice.total - a.ice.total)[0];
      cur = { ...cur, selected: top };
      save(cur);
      setStep(2);
      cur = await doGenerate(cur);
      if (!cur) return;
      setStep(3);
      await doPublish(cur);
    } finally {
      setAutopilot(false);
    }
  };

  const pick = (op: Opportunity) => { save({ ...run, selected: op, product: undefined, launch: undefined, audience: undefined, publishOn: undefined }); setStep(2); };

  const stepState = (n: Step) => {
    const done = n === 1 ? !!run.selected : n === 2 ? !!run.product : !!run.launch;
    return `${step === n ? "active" : ""} ${done ? "done" : ""}`;
  };

  const sortedOpps = useMemo(() => (run.research?.opportunities ?? []).slice().sort((a, b) => b.ice.total - a.ice.total), [run.research]);
  const price = run.launch?.price.regular ?? run.selected?.price_high ?? 0;
  const salesNeeded = price > 0 ? Math.ceil(run.goal / price) : 0;

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="wordmark"><span className="n">Norie</span><span className="d">Digi</span> <span style={{ color: "#475569", fontSize: 16 }}>Product Generator</span></div>
          <div className="hint">Find what sells, create a professional product, publish where the buyers are.</div>
        </div>
        <div className="right">
          <input type="password" placeholder="App password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: 160 }} aria-label="App password" />
          <Link className="btn btn-outline btn-sm" href="/playbook">Playbook</Link>
          <button className="btn btn-outline btn-sm" onClick={() => { setRun(newRun()); setStep(1); setError(""); setLog([]); }}>New</button>
        </div>
      </header>

      {status?.mock && (
        <div className="notice" style={{ marginTop: 0, marginBottom: 20 }}>
          <b>Demo mode.</b> No Anthropic API key is set, so every step shows sample data. Add <code>ANTHROPIC_API_KEY</code> and <code>APP_PASSWORD</code> in Vercel to run real research.
        </div>
      )}
      {status && !status.passwordRequired && !status.mock && (
        <div className="notice" style={{ marginTop: 0, marginBottom: 20 }}><b>Open access.</b> Set <code>APP_PASSWORD</code> in Vercel so only you can spend your API credits.</div>
      )}

      <ol className="steps three">
        {([1, 2, 3] as Step[]).map((n) => (
          <li key={n} className={stepState(n)}>
            <button onClick={() => setStep(n)}>
              <div className="num">STEP {n}</div>
              <div>{["Search top products", "Create the product", "Publish and sell"][n - 1]}</div>
            </button>
          </li>
        ))}
      </ol>

      <div className="layout">
        <main>
          {step === 1 && (
            <section className="card">
              <div className="eyebrow">Step 1</div>
              <h2>What is selling <span className="accent">right now</span>?</h2>
              <p className="hint">One click searches live marketplaces and communities across every category, scores what it finds, and shows how long each product takes to make. Nothing costs money until something sells.</p>
              <div className="actions" style={{ marginTop: 14 }}>
                <button className="btn btn-primary btn-lg" onClick={() => { setRun({ ...run, mode: "trending" }); doResearch({ ...run, mode: "trending" }); }} disabled={busy}>{busy && !autopilot ? <span className="spin" /> : null} Search top digital products</button>
                <button className="btn btn-gold btn-lg" onClick={doAutopilot} disabled={busy} title="Search, pick the best score, create the product, and build the launch in one go">{autopilot ? <span className="spin" /> : null} Do it all for me</button>
              </div>
              <button type="button" className="linklike" onClick={() => setShowCategory((v) => !v)}>{showCategory ? "Hide category search" : "Or search a category I choose"}</button>
              {showCategory && (
                <div className="panel" style={{ marginTop: 10 }}>
                  <label htmlFor="cat">Category or niche</label>
                  <input id="cat" type="text" value={run.category} onChange={(e) => setRun({ ...run, category: e.target.value, mode: "category" })} placeholder="e.g. HR templates for small businesses, or meal planning for busy parents" />
                  <div className="chips" aria-label="Quick starts">
                    {QUICK_STARTS.map((q) => (
                      <button key={q.label} type="button" className="chip" onClick={() => setRun({ ...run, mode: "category", category: q.category, audienceHint: q.audience, region: q.region })}>{q.label}</button>
                    ))}
                  </div>
                  <div className="row">
                    <div>
                      <label htmlFor="aud">Audience (optional)</label>
                      <input id="aud" type="text" value={run.audienceHint} onChange={(e) => setRun({ ...run, audienceHint: e.target.value })} placeholder="e.g. Filipino virtual assistants" />
                    </div>
                    <div>
                      <label htmlFor="reg">Region or market</label>
                      <input id="reg" type="text" value={run.region} onChange={(e) => setRun({ ...run, region: e.target.value })} placeholder="global, UAE, Philippines, US" />
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn btn-outline" onClick={() => doResearch({ ...run, mode: "category" })} disabled={busy || !run.category.trim()}>Research this category</button>
                  </div>
                </div>
              )}
              <Log lines={log} busy={busy} />
              {error && <div className="error">{error}</div>}

              {run.research && (
                <div style={{ marginTop: 24 }}>
                  <h3>{run.research.category === "Trending across categories" ? "What is selling this month" : `What is selling in ${run.research.category}`}</h3>
                  <p>{run.research.summary}</p>
                  <div>{run.research.best_platforms.map((p) => <span className="pill" key={p}>{p}</span>)}</div>
                  <h3 style={{ marginTop: 20 }}>Top products to make. Choose one.</h3>
                  <p className="hint">Score is impact, confidence, and ease out of 30. Time is a realistic estimate for one person with this generator.</p>
                  {sortedOpps.map((op, i) => (
                    <div key={op.name} className={`opp ${run.selected?.name === op.name ? "selected" : ""}`}>
                      <div className="head"><h3>{i === 0 ? "★ " : ""}{op.name}</h3><span className="score">ICE {op.ice.total}</span></div>
                      <div><span className="pill">{op.category}</span><span className="pill">{op.format}</span><span className="pill">{op.price_low} to {op.price_high} {op.currency}</span><span className="pill time">about {op.time_to_create_hours} h to make</span></div>
                      <p className="kv"><b>Why now:</b> {op.why_now}</p>
                      <p className="kv"><b>For:</b> {op.audience}</p>
                      <p className="kv"><b>Promise:</b> {op.promise}</p>
                      <p className="kv"><b>Demand:</b> {op.demand_signal}</p>
                      <p className="kv"><b>The gap:</b> {op.gap}</p>
                      <div className="ev">{op.evidence.map((e, j) => <div key={j}><a href={e.url} target="_blank" rel="noopener">{e.title}</a>: {e.note}</div>)}</div>
                      <div className="actions" style={{ marginTop: 12 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => pick(op)}>Create this product</button>
                      </div>
                    </div>
                  ))}
                  {run.research.avoid.length > 0 && (
                    <details><summary>Ideas to avoid right now</summary><ul>{run.research.avoid.map((a) => <li key={a}>{a}</li>)}</ul></details>
                  )}
                  <div className="actions">
                    <button className="btn btn-outline" onClick={() => downloadText(`research-${slug(run.research!.category)}.json`, JSON.stringify(run.research, null, 2), "application/json")}>Download research</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="card">
              <div className="eyebrow">Step 2</div>
              <h2>Create <span className="accent">{run.selected?.name ?? "the product"}</span></h2>
              {!run.selected && <div className="notice">Choose a product in Step 1 first.</div>}
              {run.selected && (
                <>
                  <p className="hint">Writes the complete, sellable product: cover page, what you get, every template and example filled in, how to use it. About {run.selected.time_to_create_hours} hours of your time including a read-through. Download as Word or Markdown.</p>
                  <div className="row">
                    <div>
                      <label htmlFor="author">Author or brand name</label>
                      <input id="author" type="text" value={run.author} onChange={(e) => setRun({ ...run, author: e.target.value })} placeholder="Norife Ramales, NorieDigi" />
                    </div>
                    <div>
                      <label htmlFor="len">Size</label>
                      <select id="len" value={run.length} onChange={(e) => setRun({ ...run, length: e.target.value as Run["length"] })}>
                        <option value="short">Short: checklist, prompt pack, or template set</option>
                        <option value="standard">Standard: guide or template pack</option>
                        <option value="long">Long: full ebook or course</option>
                      </select>
                    </div>
                  </div>
                  <label htmlFor="voice">Your real experience to include (optional, makes it yours)</label>
                  <textarea id="voice" value={run.voice} onChange={(e) => setRun({ ...run, voice: e.target.value })} placeholder="First person, plain words. 15 years running HR in the UAE. Include the onboarding mistake with the visa paperwork." />
                  <div className="actions">
                    <button className="btn btn-primary btn-lg" onClick={() => doGenerate()} disabled={busy}>{busy ? <span className="spin" /> : null} {run.product ? "Create it again" : "Create the product"}</button>
                    <button className="btn btn-outline" onClick={() => setStep(1)}>Back to products</button>
                  </div>
                  <Log lines={log} busy={busy} />
                  {error && <div className="error">{error}</div>}
                  {(draft || run.product) && (
                    <div style={{ marginTop: 20 }}>
                      {run.product && !draft && (
                        <div className="panel" style={{ marginBottom: 14 }}>
                          <b>Ready.</b> {run.product.markdown.split(/\s+/).length.toLocaleString()} words. Read it once, fix anything that is not you, then publish.
                          <div className="actions" style={{ marginTop: 10 }}>
                            <button className="btn btn-gold" onClick={() => downloadDocx(run.product!.title, run.author, run.product!.markdown, password).catch((e) => setError(String(e.message)))}>Download Word (.docx)</button>
                            <button className="btn btn-outline" onClick={() => downloadText(`${slug(run.product!.title)}.md`, run.product!.markdown)}>Download .md</button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>Publish and sell it</button>
                          </div>
                        </div>
                      )}
                      <div className="md-box" ref={draftRef}><Markdown text={draft || run.product!.markdown} /></div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="card">
              <div className="eyebrow">Step 3</div>
              <h2>Publish and sell <span className="accent">{run.product?.title ?? "the product"}</span></h2>
              {!run.product && <div className="notice">Create the product in Step 2 first.</div>}
              {run.product && (
                <>
                  <p className="hint">One click finds where the buyers are, sets the price, writes the listings, emails and posts, and suggests the platform to publish on first. Free-to-start platforms come first.</p>
                  <div className="actions">
                    <button className="btn btn-primary btn-lg" onClick={() => doPublish()} disabled={busy}>{busy ? <span className="spin" /> : null} {run.launch ? "Build it again" : "Find buyers and build the launch"}</button>
                  </div>
                  <Log lines={log} busy={busy} />
                  {error && <div className="error">{error}</div>}
                  {run.launch && (
                    <>
                      <Suggestion l={run.launch} chosen={run.publishOn} />
                      <LaunchView l={run.launch} chosen={run.publishOn} onChoose={(p) => save({ ...run, publishOn: p })} onDownload={() => downloadText(`launch-kit-${slug(run.product!.title)}.md`, launchToMarkdown(run.launch!))} onDocx={() => downloadDocx(`${run.product!.title} launch kit`, run.author, launchToMarkdown(run.launch!), password).catch((e) => setError(String(e.message)))} />
                      {run.audience && (
                        <details style={{ marginTop: 16 }}><summary>Where the buyers are ({run.audience.channels.length} channels) and what to say</summary>
                          <AudienceView a={run.audience} onNext={() => {}} onDownload={() => downloadText(`audience-${slug(run.selected!.name)}.json`, JSON.stringify(run.audience, null, 2), "application/json")} hideNext />
                        </details>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </main>

        <aside className="side">
          <div className="card">
            <h3>Money plan</h3>
            <label htmlFor="goal">Monthly goal (USD)</label>
            <input id="goal" type="text" inputMode="numeric" value={run.goal} onChange={(e) => setRun({ ...run, goal: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })} />
            {price > 0 ? (
              <p className="kv" style={{ marginTop: 10 }}>At <b>{price} {run.launch?.price.currency ?? run.selected?.currency ?? "USD"}</b> that is <b>{salesNeeded} sales a month</b>, about {Math.ceil(salesNeeded / 4.3)} a week. Three products at this level triple the reach for the same audience.</p>
            ) : (
              <p className="hint" style={{ marginTop: 10 }}>Pick a product to see how many sales reach your goal.</p>
            )}
          </div>
          <div className="card">
            <h3>This run</h3>
            <table className="grid">
              <tbody>
                <tr><th>Search</th><td>{run.mode === "trending" ? "Top products this month" : run.category || "not set"}</td></tr>
                <tr><th>Product</th><td>{run.selected?.name ?? "none yet"}</td></tr>
                <tr><th>Time to make</th><td>{run.selected ? `about ${run.selected.time_to_create_hours} hours` : "..."}</td></tr>
                <tr><th>Created</th><td>{run.product ? `${run.product.markdown.split(/\s+/).length.toLocaleString()} words` : "not yet"}</td></tr>
                <tr><th>Publish on</th><td>{run.publishOn ?? "decided in Step 3"}</td></tr>
                <tr><th>Launch kit</th><td>{run.launch ? "ready" : "not yet"}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Past products</h3>
            {runs.length === 0 && <p className="hint">Saved in this browser.</p>}
            <ul className="runs">
              {runs.map((r) => (
                <li key={r.id}>
                  <button onClick={() => { setRun(r); setStep(r.launch ? 3 : r.product ? 2 : 1); setError(""); setLog([]); }}>{r.selected?.name ?? (r.mode === "trending" ? "Top products search" : r.category) ?? "Untitled"}</button>
                  <button className="del" onClick={() => removeRun(r.id)} aria-label="Delete">remove</button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function suggestPlatform(l: LaunchResult): string | undefined {
  const order = { free: 0, "pay per listing": 1, "monthly fee": 2 };
  const best = l.where_to_sell.filter((w) => w.role !== "skip").slice().sort((a, b) => order[a.upfront_cost] - order[b.upfront_cost] || a.priority - b.priority)[0];
  if (!best) return undefined;
  return platformByName(best.platform)?.name ?? best.platform;
}

function Suggestion({ l, chosen }: { l: LaunchResult; chosen?: string }) {
  const name = suggestPlatform(l);
  const rec = l.where_to_sell.find((w) => (platformByName(w.platform)?.name ?? w.platform) === name);
  if (!name || !rec) return null;
  return (
    <div className="auto" style={{ marginTop: 20 }}>
      <b>Our suggestion: publish on {name} first.</b> {rec.why} It is {rec.upfront_cost === "free" ? "free to start" : rec.upfront_cost} and takes about {rec.setup_minutes} minutes. {rec.fee_note}
      {chosen && chosen !== name && <div className="hint" style={{ marginTop: 6 }}>You picked {chosen} instead. The steps below follow your choice.</div>}
      <div className="hint" style={{ marginTop: 6 }}>Launch price {l.price.launch} {l.price.currency} for 72 hours, then {l.price.regular} {l.price.currency}. Next offer: {l.upsell_path}</div>
    </div>
  );
}

function Log({ lines, busy }: { lines: LogLine[]; busy: boolean }) {
  if (!lines.length && !busy) return null;
  return (
    <div className="log" style={{ marginTop: 16 }}>
      {lines.map((l, i) => <div key={i} className={l.kind}>{l.text}</div>)}
      {busy && <div className="s">working, this can take one to three minutes</div>}
    </div>
  );
}

function AudienceView({ a, onNext, onDownload, hideNext }: { a: AudienceResult; onNext: () => void; onDownload: () => void; hideNext?: boolean }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div className="panel">
        <h3>Who buys this</h3>
        <p className="kv"><b>Who:</b> {a.buyer_profile.who}</p>
        <p className="kv"><b>Job to be done:</b> {a.buyer_profile.job_to_be_done}</p>
        <p className="kv"><b>Trigger moment:</b> {a.buyer_profile.trigger_moment}</p>
        <p className="kv"><b>Objections:</b> {a.buyer_profile.objections.join(" · ")}</p>
        <p className="kv"><b>Their words:</b> {a.buyer_profile.language_they_use.map((w) => `"${w}"`).join(", ")}</p>
      </div>
      <h3 style={{ marginTop: 20 }}>Where they are, best first</h3>
      {a.channels.slice().sort((x, y) => x.priority - y.priority).map((c) => (
        <div key={c.platform + c.priority} className="opp" style={{ cursor: "default" }}>
          <div className="head"><h3>{c.platform}</h3><span className="score">priority {c.priority} · {c.effort} effort</span></div>
          <p className="kv"><b>Why here:</b> {c.why_here}</p>
          <div>{c.where_exactly.map((w) => <span className="pill" key={w}>{w}</span>)}</div>
          <p className="kv"><b>What to post:</b> {c.content_angle}</p>
          <p className="kv"><b>CTA:</b> {c.cta}</p>
        </div>
      ))}
      <details><summary>Search keywords</summary><div>{a.search_keywords.map((k) => <span className="pill" key={k}>{k}</span>)}</div></details>
      <details><summary>Hooks for posts</summary><ul>{a.hooks.map((h) => <li key={h}>{h}</li>)}</ul></details>
      <details><summary>Outreach messages</summary>{a.outreach_messages.map((m, i) => <div key={i} style={{ marginTop: 10 }}><b>{m.context}</b><pre>{m.message}</pre></div>)}</details>
      <details><summary>One-week posting plan</summary><p>{a.posting_plan}</p></details>
      <details><summary>Sources</summary><div className="ev">{a.evidence.map((e, i) => <div key={i}><a href={e.url} target="_blank" rel="noopener">{e.title}</a>: {e.note}</div>)}</div></details>
      <div className="actions">
        {!hideNext && <button className="btn btn-primary" onClick={onNext}>Write the product</button>}
        <button className="btn btn-outline" onClick={onDownload}>Download audience research</button>
      </div>
    </div>
  );
}

function LaunchView({ l, chosen, onChoose, onDownload, onDocx }: { l: LaunchResult; chosen?: string; onChoose: (p: string) => void; onDownload: () => void; onDocx: () => void }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div className="panel">
        <h3>{l.product_name}</h3>
        <p>{l.tagline}</p>
        <p className="kv"><b>Launch price:</b> {l.price.launch} {l.price.currency} for 72 hours, then {l.price.regular} {l.price.currency}. {l.price.reasoning}</p>
        <p className="kv"><b>Next offer:</b> {l.upsell_path}</p>
      </div>
      <PublishChooser l={l} chosen={chosen} onChoose={onChoose} />
      <details open style={{ marginTop: 16 }}><summary>Sales page</summary>
        <h3 style={{ marginTop: 12 }}>{l.sales_page.headline}</h3>
        <p>{l.sales_page.subheadline}</p>
        <p className="kv"><b>Problem:</b> {l.sales_page.problem}</p>
        <p className="kv"><b>For:</b></p><ul>{l.sales_page.who_its_for.map((w) => <li key={w}>{w}</li>)}</ul>
        <p className="kv"><b>Inside:</b></p><ul>{l.sales_page.whats_inside.map((w) => <li key={w}>{w}</li>)}</ul>
        <p className="kv"><b>Proof:</b> {l.sales_page.proof_placeholder}</p>
        {l.sales_page.faq.map((f) => <p className="kv" key={f.q}><b>{f.q}</b> {f.a}</p>)}
        <p className="kv"><b>CTA:</b> {l.sales_page.cta}</p>
      </details>
      <details><summary>Marketplace listings ({l.listings.length})</summary>
        {l.listings.map((x) => <div key={x.platform} style={{ marginTop: 12 }}><b>{x.platform}:</b> {x.title}<div>{x.tags.map((t) => <span className="pill" key={t}>{t}</span>)}</div><p className="kv">{x.description}</p></div>)}
      </details>
      <details><summary>Launch emails ({l.emails.length})</summary>
        {l.emails.map((e) => <div key={e.day} style={{ marginTop: 12 }}><b>Day {e.day}: {e.subject}</b><pre>{e.body}</pre></div>)}
      </details>
      <details><summary>Social posts ({l.posts.length})</summary>
        {l.posts.map((p, i) => <div key={i} style={{ marginTop: 12 }}><b>{p.platform}</b><pre>{p.hook}{"\n\n"}{p.body}{"\n\n"}{p.cta}</pre></div>)}
      </details>
      <details><summary>30-day calendar</summary>
        <table className="grid"><tbody>{l.calendar.map((c) => <tr key={c.day}><th style={{ width: 80 }}>Day {c.day}</th><td>{c.action}</td></tr>)}</tbody></table>
      </details>
      <div className="actions">
        <button className="btn btn-gold" onClick={onDocx}>Download launch kit .docx</button>
        <button className="btn btn-outline" onClick={onDownload}>Download .md</button>
      </div>
    </div>
  );
}

function PublishChooser({ l, chosen, onChoose }: { l: LaunchResult; chosen?: string; onChoose: (p: string) => void }) {
  const order = { free: 0, "pay per listing": 1, "monthly fee": 2 };
  const recs = l.where_to_sell.filter((w) => w.role !== "skip").slice().sort((a, b) => order[a.upfront_cost] - order[b.upfront_cost] || a.priority - b.priority);
  const skipped = l.where_to_sell.filter((w) => w.role === "skip");
  const active = chosen ? platformByName(chosen) : undefined;
  const listing = active ? l.listings.find((x) => x.platform.toLowerCase().includes(active.key) || x.platform.toLowerCase().includes(active.name.toLowerCase().split(" ")[0])) ?? l.listings[0] : undefined;
  const others = PLATFORMS.filter((p) => !recs.some((w) => platformByName(w.platform)?.key === p.key));
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Choose where to publish</h3>
      <p className="hint">Free-to-start first. You pay nothing until a sale happens on the free ones. Pick one and the exact publishing steps appear below.</p>
      <div className="platforms">
        {recs.map((w) => {
          const p = platformByName(w.platform);
          const key = p?.name ?? w.platform;
          return (
            <button type="button" key={key} className={`platform ${chosen === key ? "on" : ""}`} onClick={() => onChoose(key)} aria-pressed={chosen === key}>
              <div className="head"><b>{key}</b><span className={`cost ${w.upfront_cost === "free" ? "free" : ""}`}>{w.upfront_cost === "free" ? "free to start" : w.upfront_cost}</span></div>
              <div className="kv">{w.role} · about {w.setup_minutes} min to set up</div>
              <div className="kv">{w.why}</div>
              <div className="ev">{w.fee_note}</div>
            </button>
          );
        })}
      </div>
      {others.length > 0 && (
        <details><summary>Other platforms you could use</summary>
          <div className="platforms" style={{ marginTop: 10 }}>
            {others.map((p) => (
              <button type="button" key={p.key} className={`platform ${chosen === p.name ? "on" : ""}`} onClick={() => onChoose(p.name)} aria-pressed={chosen === p.name}>
                <div className="head"><b>{p.name}</b><span className={`cost ${p.upfront === "free" ? "free" : ""}`}>{p.upfront === "free" ? "free to start" : p.upfront}</span></div>
                <div className="kv">about {p.setupMinutes} min · {p.bestFor}</div>
                <div className="ev">{p.feeOnSale}</div>
              </button>
            ))}
          </div>
          {skipped.length > 0 && <ul style={{ marginTop: 10 }}>{skipped.map((w) => <li key={w.platform} className="hint"><b>{w.platform}:</b> skip. {w.why}</li>)}</ul>}
        </details>
      )}
      {active && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Publish on {active.name}</h3>
          <p className="kv"><b>Fee:</b> {active.feeOnSale}. <b>Payout:</b> {active.payout}. <a href={active.url} target="_blank" rel="noopener">Open {active.name}</a></p>
          <ol>{active.steps.map((st) => <li key={st}>{st}</li>)}</ol>
          <p className="kv"><b>Listing tips:</b> {active.listingTips.join(" ")}</p>
          {listing && (
            <div style={{ marginTop: 10 }}>
              <b>Paste this listing</b>
              <pre>{`Title: ${listing.title}\n\nTags: ${listing.tags.join(", ")}\n\n${listing.description}`}</pre>
              <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(`Title: ${listing.title}\n\nTags: ${listing.tags.join(", ")}\n\n${listing.description}`)}>Copy listing</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function launchToMarkdown(l: LaunchResult): string {
  const lines: string[] = [];
  lines.push(`# ${l.product_name}: launch kit`, "", l.tagline, "");
  lines.push("## Pricing", "", `Launch price: ${l.price.launch} ${l.price.currency} for 72 hours. Regular: ${l.price.regular} ${l.price.currency}.`, "", l.price.reasoning, "", `Next offer: ${l.upsell_path}`, "");
  lines.push("## Where to publish (free-to-start first)", "", ...l.where_to_sell.slice().sort((a, b) => a.priority - b.priority).map((w) => `- **${w.platform}** (${w.role}, ${w.upfront_cost}, about ${w.setup_minutes} min): ${w.why} Fees: ${w.fee_note}`), "");
  lines.push("## Sales page", "", `### ${l.sales_page.headline}`, "", l.sales_page.subheadline, "", "**Problem**", "", l.sales_page.problem, "", "**Who it is for**", "", ...l.sales_page.who_its_for.map((w) => `- ${w}`), "", "**What is inside**", "", ...l.sales_page.whats_inside.map((w) => `- ${w}`), "", "**Proof**", "", l.sales_page.proof_placeholder, "", "**FAQ**", "", ...l.sales_page.faq.flatMap((f) => [`- **${f.q}** ${f.a}`]), "", `**CTA:** ${l.sales_page.cta}`, "");
  lines.push("## Listings", "");
  for (const x of l.listings) lines.push(`### ${x.platform}`, "", `**Title:** ${x.title}`, "", `**Tags:** ${x.tags.join(", ")}`, "", x.description, "");
  lines.push("## Launch emails", "");
  for (const e of l.emails) lines.push(`### Day ${e.day}: ${e.subject}`, "", e.body, "");
  lines.push("## Social posts", "");
  for (const p of l.posts) lines.push(`### ${p.platform}`, "", p.hook, "", p.body, "", p.cta, "");
  lines.push("## 30-day calendar", "", ...l.calendar.map((c) => `- Day ${c.day}: ${c.action}`), "");
  return lines.join("\n");
}
