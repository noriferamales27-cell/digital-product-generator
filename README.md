# NorieDigi Digital Product Generator

One app that does what the AED 7,000 "digital product generator" offers charge for, on your own stack:

1. **Research the market.** Type any category. Claude searches live marketplaces (Etsy, Gumroad, Notion, Whop, Amazon KDP) and communities, then returns 4 to 8 scored opportunities with price bands, competition, the gap to fill, and source links.
2. **Find the buyers.** For the opportunity you pick, it finds the named groups, subreddits, hashtags, search terms, and marketplaces where those buyers already are, the words they use, hooks, outreach messages, and a posting plan.
3. **Write the product.** It writes the whole thing in one pass: ebook, template pack, prompt pack, checklist, planner, spreadsheet spec, mini-course, or email course. Download as .docx or .md.
4. **Launch kit.** Pricing, six-block sales page, marketplace listings with tags, five launch emails, social posts for the channels found in step 2, a 30-day calendar, and the upsell path.

Runs are saved in the browser so you can come back to any product.

## Stack

Next.js 16 (App Router) on Vercel, Anthropic SDK with Claude Opus 5 and the built-in web search tool, zod for schema-locked outputs, `docx` for Word export. No database in v1.

## Run it locally

```
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000. To try the interface without spending API calls, set `MOCK_MODE=1` in `.env.local`.

## Deploy on Vercel

1. Import this repository into Vercel.
2. Add environment variables: `ANTHROPIC_API_KEY`, and `APP_PASSWORD` so only you can run it.
3. Deploy. The research and generation routes set `maxDuration = 300`; on the Hobby plan the limit is lower, so if a long product times out, upgrade the plan or pick the short length.

## Cost per run

Each stage is one Claude call with web search where needed. A full run (research, audience, standard product, launch kit) uses roughly 60k to 120k output tokens plus search fees. Budget about one to three US dollars per complete product at Opus 5 pricing. That is the whole cost of the "generator".

## Layout

```
src/app/page.tsx              the wizard
src/components/Generator.tsx  four steps, run history, downloads
src/app/api/research          step 1 (web search + ICE scoring)
src/app/api/audience          step 2 (web search + channel map)
src/app/api/generate          step 3 (streamed Markdown)
src/app/api/launch            step 4 (launch kit JSON)
src/app/api/export            Markdown to .docx
src/lib/claude.ts             streaming loop, pause_turn resume, schema parse
src/lib/prompts.ts            the stage prompts and voice rules
src/lib/schemas.ts            zod schemas for every stage
docs/                         the plan, market scan, backlog, and launch playbook
```
