# Digital Product Generator: Plan

Headline: build a five-stage pipeline (Research, Generate, Package, Launch, Learn) that runs inside Claude Code with Make, Canva, and HubSpot doing the plumbing. Ship the first product through it within two weeks, using what already exists (the VA eBook and the free prompt library), and let every later product reuse the same rails.

## 1. The real question

The ask is "a generator that makes every kind of digital product." The goal underneath is income that does not depend on hours sold: products that sell while consulting and content keep running. So the generator is judged on one number: sellable products shipped per month, and revenue per product. Not on how many product types it can technically produce.

Assumption: Norie is the only operator, with Claude Code, Make, Canva, HubSpot, Supabase, and Vercel already in hand. No ad budget beyond a small test. The website shop currently sells via WhatsApp, which is the biggest single leak in the funnel today.

## 2. Options considered

**Option A: Build a software product (SaaS style generator with a UI).**
Highest ceiling, and it could itself be sold later. It breaks on time: months of build before the first sale, and the market already has generators (Inkfluence AI, Kupkaike, Book Bolt, Canva AI). Competing on tooling means competing with funded teams.

**Option B: Build an internal pipeline out of Claude Code skills plus Make scenarios.**
Every stage is a skill with a checklist and templates, outputs land in a folder per product, and Make handles delivery and CRM. Cheap, fast, and it compounds: each product improves the templates for the next. It breaks if the skills stay vague. Each one must produce a real file, not advice.

**Option C: Skip the generator, just make products by hand one at a time.**
Fastest first sale. It breaks at product three, when research, packaging, and launch each get redone from scratch and quality drifts.

Steelman for A: a generator that others can use is a product line of its own, and "AI-Powered Ops for SMEs" could sell it. Right call for 2027, wrong call for the next 90 days because there are zero products flowing yet.

**Call: Option B.** The reason that matters most: it produces sellable products in the first month, and the pipeline itself is the moat, not the tooling. Option A stays on the roadmap as a possible SaaS once ten products have shipped and the pipeline is proven.

## 3. What the generator does

Five stages. Each is a Claude Code skill with a fixed input, a fixed output, and a checklist. Nothing moves to the next stage without the output file existing.

### Stage 1: Research (skill `product-research`)

Input: a niche or audience. Output: `research/<slug>.md` with a scored opportunity.

- Scan the marketplaces buyers already use: Etsy, Gumroad, Notion Marketplace, Whop, Creative Market, Amazon KDP, plus Facebook OFW groups and LinkedIn for pain signals.
- Capture for each candidate: top 10 competing listings, price band, review count, what buyers praise or complain about, and the gap NorieDigi can fill from real experience.
- Score with ICE (Impact, Confidence, Ease, 1 to 10 each). Confidence gets a bonus only when Norie has done the job by hand. Anything under 18 total is parked.
- Hard rule from the brand skill: no invented numbers. If a stat comes from a search, cite it.

### Stage 2: Generate (skill `product-generate`, one sub-template per format)

Input: the approved research file plus a one-page product spec. Output: the actual product files.

Formats the generator supports on day one, and what produces them:

| Format | Producer | Output |
|---|---|---|
| eBook or guide (20 to 80 pages) | Claude Code drafting into the `docx` skill, exported to PDF | `.docx` + `.pdf` |
| Prompt pack | Claude Code, structured markdown, exported as PDF and Notion page | `.pdf` + Notion link |
| Templates pack (HR, SOP, proposals) | `docx` skill for documents, `xlsx` skill for trackers | `.docx` + `.xlsx` |
| Trackers, dashboards, lightweight CRM | `xlsx` skill; Google Sheets copy for delivery | `.xlsx` + Sheets link |
| Notion system | Notion MCP builds the workspace; duplicate link is the deliverable | Notion template link |
| Canva templates (social posts, workbooks, covers) | Canva MCP from brand kit | Canva template link |
| Checklists, planners, printables | `docx` or Canva, exported to PDF | `.pdf` |
| Email course or swipe file | Claude Code markdown, loaded into HubSpot sequence | `.md` + HubSpot sequence |
| Mini-course (video) | Scripts from the `content` skill; recording is manual, HyperFrames for intros | Scripts + video files |

Every format runs the same QA before it counts as done: brand check (cream, ink, serif headings, Poppins body), voice check (first person, plain words, real numbers only), a two-person test where one person outside the project uses it cold, and a file-open test on phone and desktop.

### Stage 3: Package (skill `product-package`)

Input: finished product files. Output: a `products/<slug>/package/` folder containing:

- Cover and three mockups (Canva, from a reusable brand template).
- Sales page copy in the six-block structure: problem, who it is for, what is inside, proof, price, FAQ. One CTA.
- Pricing in the tested 2026 bands: $9 to $29 for templates and packs, $19 to $49 for guides and systems, $49 to $199 for courses and bundles. Packs outsell singles, so default to a pack.
- Listing copy adapted per channel (own site, Gumroad, Etsy where relevant).
- A `product.yaml` manifest: slug, audience, promise, format, price, files, status.

### Stage 4: Launch (skill `product-launch`, follows `marketing/launch-playbook.md`)

Output: a launch kit folder with a waitlist page block, a five-email sequence, twelve social posts, two screen-share demo scripts, and a launch calendar. Details in the playbook.

### Stage 5: Learn (weekly, ten minutes)

Make pulls sales, refunds, and page views into a Supabase table; a Sunday Claude Code routine reads it and writes a one-paragraph verdict per product: keep, bundle, reprice, or retire. What sells feeds back into Stage 1 scoring.

## 4. Architecture

```
digital-product-generator/
  .claude/skills/
    product-research/     SKILL.md + scoring template
    product-generate/     SKILL.md + one template per format
    product-package/      SKILL.md + sales page and manifest templates
    product-launch/       SKILL.md + email, post, and calendar templates
  research/               one file per opportunity scanned
  catalog/                backlog.md (scored) and one product.yaml per product
  products/<slug>/        source/, build/, package/, launch/
  marketing/              launch-playbook.md, swipe files, sequences
  automation/             Make blueprints (exported JSON) and the Supabase schema
```

Plumbing:

- **Storefront:** move off WhatsApp. Use a merchant-of-record checkout (Lemon Squeezy or Payhip) embedded on noriedigi.com/learning so the site keeps its own traffic and the tax handling is done for you. Keep Gumroad and Etsy listings for marketplace discovery only. Decide by payout: whichever pays cleanly to a UAE or Philippine bank wins.
- **Delivery:** checkout webhook to Make, Make sends the file link, creates or updates the HubSpot contact with a `product_purchased` property, and inserts a row in Supabase for the dashboard.
- **List:** every free download (50 prompts, starter kit) already lands in Supabase. Sync those to HubSpot so a product launch has a list to mail on day one.
- **Brand:** the `brand` skill and `tokens.css` are the source of truth for every cover, page, and post. Install the `noriedigi-brand` plugin in the new repo.

## 5. What to build, in order (MoSCoW)

**Must (weeks 1 to 2)**
- Instant checkout live for the VA eBook, replacing the WhatsApp button.
- `product-package` and `product-launch` skills, because the first product already exists and only needs packaging and a launch.
- HubSpot sync of the existing Supabase leads.

**Should (weeks 3 to 6)**
- `product-research` skill with the ICE sheet and the first three research files.
- `product-generate` for the three formats the first five products need: documents, spreadsheets, prompt packs.
- Make delivery scenario and the Supabase sales table.

**Could (weeks 7 to 12)**
- Notion and Canva format templates.
- Weekly Learn routine.
- Affiliate link setup for the VA community.

**Won't (this quarter)**
- A public UI or SaaS version of the generator.
- Video courses. Scripts only until three document products have sold.
- Any product outside the two proven audiences.

## 6. First five products

Scored in `catalog/backlog.md`. In shipping order:

1. **The AI-Powered VA eBook** (exists, $19): relaunch with instant checkout and a prompt-pack bonus. Week 1.
2. **HR Templates Pack for Growing SMEs** ($39): offer letters, onboarding checklist, interview scorecards, policy starters. UAE-aware wording. This is the product only Norie can write. Week 3.
3. **HR & Ops Prompt System** ($27): the paid sibling of the free 50 prompts, 150 prompts organised by workflow with examples of the output. Week 4.
4. **Lead Tracker and Lightweight CRM** ($19, Sheets + Notion): lightweight CRMs are one of the four categories carrying most template sales. Week 6.
5. **VA Starter Kit** ($15, Taglish): proposal templates, profile rewrite prompts, rate ladder, client email swipe file. Bundles with the eBook at $29. Week 7.

Then bundle: "SME Ops Starter" (products 2 + 3 + 4 at $69) and "VA Launch Bundle" (1 + 5 at $29).

## 7. How this fits the bigger picture

- **Digital products** go from a WhatsApp side table to a real stream with a ladder: free download, $15 to $39 product, $69 bundle, workshop, strategy call. Products become the cheapest way to earn a consulting lead.
- **VA services and AI systems** get proof assets for free: every template pack is a sample of what a client gets done for them.
- **Content and community** get a reason to post: each product yields two demo videos and twelve posts through the existing `content` skill.
- **SaaS** waits, but the pipeline data (what SMEs buy, at what price) is the validation the HR SaaS needs before a build.
- Hidden cost: packaging and launch take longer than generation. Budget two days per product for those, or the pipeline stalls at "made but unsold." Second-order risk: marketplace fees and refunds on low-ticket products eat margin, so the own-site checkout matters more than it looks.

## 8. Numbers to run it by

| Metric | Target by day 90 |
|---|---|
| Products live with instant checkout | 5 |
| Waitlist size before each launch | 300+ (500+ triples conversion versus a cold launch) |
| Launch-week sales per product | 20 |
| Free download to paid conversion | 3% |
| Product buyer to strategy call | 2% |
| Time from idea to sellable | 5 working days |

## 9. Risks and what to do about them

| Risk | Mitigation |
|---|---|
| Generic AI-written products that look like everyone else's | Confidence bonus in ICE only for jobs Norie has done by hand; every product includes a real example from real work |
| Products made but not launched | Package and Launch skills are built before Generate; nothing is "done" without a launch kit |
| Payment and payout friction from the UAE | Pick the checkout by payout test first, before building the delivery scenario |
| Audiences mixed in one product page | Two shop sections on /learning, one per audience, per the brand rule |
| Refund rate on low-ticket items | Preview pages and a sample download on every listing |

## 10. Do this next

1. Pick the checkout: open Lemon Squeezy and Payhip, run a $1 test payout to your bank, choose the one that clears.
2. Give Claude the go on the `product-package` skill and relaunch the VA eBook with instant checkout this week.
3. Create the `digital-product-generator` repo on GitHub so this folder can move there and the skills can live with the products.

## Roadmap

| Window | Outcome |
|---|---|
| Days 1 to 14 | Checkout live, eBook relaunched, package and launch skills working, HubSpot list synced |
| Days 15 to 45 | Research and generate skills built, HR Templates Pack and Prompt System shipped |
| Days 46 to 90 | CRM tracker and VA Starter Kit shipped, two bundles live, Learn routine running, decision on the SaaS version |
