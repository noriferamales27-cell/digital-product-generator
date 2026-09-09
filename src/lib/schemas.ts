import { z } from "zod";

// Every stage of the generator produces one of these shapes. They double as
// the structured-output schema sent to Claude and the validator on the way back.

export const Evidence = z.object({
  title: z.string(),
  url: z.string(),
  note: z.string().describe("What this source shows, in one line"),
});

export const Opportunity = z.object({
  name: z.string(),
  category: z.string().describe("The market category this sits in, e.g. HR templates, meal planning, wedding printables"),
  format: z.string().describe("ebook, template pack, prompt pack, planner, checklist, notion system, canva templates, mini-course, email course, spreadsheet, swipe file, or other"),
  audience: z.string(),
  promise: z.string().describe("The one-sentence outcome the buyer pays for"),
  price_low: z.number(),
  price_high: z.number(),
  currency: z.string().default("USD"),
  demand_signal: z.string().describe("Concrete evidence of demand: listing counts, review counts, search volume, community size"),
  competition: z.string().describe("Who already sells this and how crowded it is"),
  gap: z.string().describe("What the existing products miss that this one will do"),
  why_now: z.string().describe("Why this is selling right now: a trend, a season, a platform change, a recurring need"),
  time_to_create_hours: z.number().describe("Realistic hours for one person using this generator plus light editing to make it sellable"),
  ice: z.object({
    impact: z.number().min(1).max(10),
    confidence: z.number().min(1).max(10),
    ease: z.number().min(1).max(10),
    total: z.number(),
  }),
  evidence: z.array(Evidence),
});

export const ResearchResult = z.object({
  category: z.string().describe("The category researched, or 'Trending across categories'"),
  summary: z.string().describe("Three to five plain sentences on what is selling in this category right now"),
  best_platforms: z.array(z.string()),
  opportunities: z.array(Opportunity).min(3).max(8),
  avoid: z.array(z.string()).describe("Product ideas in this category that look attractive but are saturated or low value"),
});

export const Channel = z.object({
  platform: z.string(),
  why_here: z.string(),
  where_exactly: z.array(z.string()).describe("Named groups, subreddits, hashtags, forums, newsletters, marketplaces, search terms. Specific, not generic."),
  content_angle: z.string().describe("What to post there that earns attention without selling"),
  cta: z.string(),
  effort: z.enum(["low", "medium", "high"]),
  priority: z.number().min(1).max(5),
});

export const AudienceResult = z.object({
  buyer_profile: z.object({
    who: z.string(),
    job_to_be_done: z.string(),
    trigger_moment: z.string().describe("The moment they go looking for this product"),
    objections: z.array(z.string()),
    language_they_use: z.array(z.string()).describe("Exact phrases buyers use when describing the problem"),
  }),
  channels: z.array(Channel).min(3).max(8),
  search_keywords: z.array(z.string()),
  hooks: z.array(z.string()).describe("Opening lines for posts, 8 to 12 words each"),
  outreach_messages: z.array(z.object({ context: z.string(), message: z.string() })),
  posting_plan: z.string().describe("A one-week posting rhythm across the top channels"),
  evidence: z.array(Evidence),
});

export const LaunchResult = z.object({
  product_name: z.string(),
  tagline: z.string(),
  price: z.object({ launch: z.number(), regular: z.number(), currency: z.string(), reasoning: z.string() }),
  sales_page: z.object({
    headline: z.string(),
    subheadline: z.string(),
    problem: z.string(),
    who_its_for: z.array(z.string()),
    whats_inside: z.array(z.string()),
    proof_placeholder: z.string().describe("Where real proof goes once it exists. Never invented testimonials."),
    faq: z.array(z.object({ q: z.string(), a: z.string() })),
    cta: z.string(),
  }),
  listings: z.array(z.object({
    platform: z.string(),
    title: z.string(),
    tags: z.array(z.string()),
    description: z.string(),
  })),
  emails: z.array(z.object({ day: z.number(), subject: z.string(), body: z.string() })).min(5),
  posts: z.array(z.object({ platform: z.string(), hook: z.string(), body: z.string(), cta: z.string() })).min(8),
  calendar: z.array(z.object({ day: z.number(), action: z.string() })),
  where_to_sell: z.array(z.object({
    platform: z.string(),
    role: z.enum(["main store", "search channel", "discovery listing", "skip"]),
    upfront_cost: z.enum(["free", "pay per listing", "monthly fee"]),
    why: z.string(),
    fee_note: z.string().describe("The fee on a sale and any payout constraint for the seller's region"),
    setup_minutes: z.number().describe("Minutes to open an account and publish the first listing"),
    priority: z.number().min(1).max(5),
  })).min(3),
  upsell_path: z.string(),
});

export const SellerProfile = z.object({
  name: z.string().max(120).optional().default(""),
  brand: z.string().max(120).optional().default(""),
  experience: z.string().max(1500).optional().default("").describe("What the seller has actually done: jobs, years, industries, results"),
  audience: z.string().max(600).optional().default("").describe("Who already listens to them or who they can reach"),
  assets: z.string().max(800).optional().default("").describe("Things they already have: documents, templates, past products, an email list"),
  goals: z.string().max(400).optional().default(""),
});

export const ProductPlan = z.object({
  title: z.string(),
  subtitle: z.string().describe("The promise in one line"),
  angle: z.string().describe("Positioning in one sentence: why this one and not the generic version"),
  audience_detail: z.string(),
  format: z.string(),
  length: z.enum(["short", "standard", "long"]),
  outline: z.array(z.object({ section: z.string(), includes: z.array(z.string()) })).min(4),
  must_include: z.array(z.string()).describe("Things the seller said must be inside"),
  seller_experience_to_use: z.array(z.string()).describe("Specific stories, numbers, or examples from the seller to weave in"),
  differentiators: z.array(z.string()),
  tone: z.string(),
  price_suggestion: z.object({ launch: z.number(), regular: z.number(), currency: z.string() }),
  bonuses: z.array(z.string()).describe("Small add-ons that raise perceived value at low cost"),
  risks: z.array(z.string()).describe("What could make this flop, and the plan's answer to each"),
});

export const ChatMessage = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) });

export const PlanInput = z.object({
  opportunity: Opportunity,
  profile: SellerProfile.optional(),
  messages: z.array(ChatMessage).max(40).default([]),
  finish: z.boolean().default(false).describe("True when the seller wants the plan now, whatever has been answered"),
});

export const PlanTurn = z.object({
  reply: z.string().describe("What to say to the seller: a short reaction to their answer plus the next single question, or a wrap-up line when done"),
  done: z.boolean(),
  progress: z.number().min(0).max(1).describe("How close the plan is to complete"),
  plan: ProductPlan.nullable(),
});

export type Evidence = z.infer<typeof Evidence>;
export type SellerProfile = z.infer<typeof SellerProfile>;
export type ProductPlan = z.infer<typeof ProductPlan>;
export type ChatMessage = z.infer<typeof ChatMessage>;
export type PlanInput = z.infer<typeof PlanInput>;
export type PlanTurn = z.infer<typeof PlanTurn>;
export type Opportunity = z.infer<typeof Opportunity>;
export type ResearchResult = z.infer<typeof ResearchResult>;
export type AudienceResult = z.infer<typeof AudienceResult>;
export type LaunchResult = z.infer<typeof LaunchResult>;

export const ResearchInput = z.object({
  mode: z.enum(["category", "trending"]).default("category"),
  category: z.string().max(200).optional().default(""),
  audience: z.string().max(300).optional().default(""),
  region: z.string().max(100).optional().default("global"),
  notes: z.string().max(1000).optional().default(""),
});

export const AudienceInput = z.object({
  opportunity: Opportunity,
  region: z.string().max(100).optional().default("global"),
});

export const GenerateInput = z.object({
  opportunity: Opportunity,
  audience: AudienceResult.optional(),
  plan: ProductPlan.optional(),
  profile: SellerProfile.optional(),
  length: z.enum(["short", "standard", "long"]).default("standard"),
  voice: z.string().max(600).optional().default(""),
  author: z.string().max(120).optional().default(""),
});

export const LaunchInput = z.object({
  opportunity: Opportunity,
  audience: AudienceResult.optional(),
  product_title: z.string(),
  product_outline: z.string().max(6000),
  brand: z.string().max(120).optional().default(""),
});

export const ExportInput = z.object({
  title: z.string().max(200),
  author: z.string().max(120).optional().default(""),
  markdown: z.string().max(400000),
});

export type ResearchInput = z.infer<typeof ResearchInput>;
export type AudienceInput = z.infer<typeof AudienceInput>;
export type GenerateInput = z.infer<typeof GenerateInput>;
export type LaunchInput = z.infer<typeof LaunchInput>;
export type ExportInput = z.infer<typeof ExportInput>;

// Events streamed from the API routes to the browser as NDJSON lines.
export type StreamEvent =
  | { type: "status"; text: string }
  | { type: "search"; query: string }
  | { type: "delta"; text: string }
  | { type: "result"; data: unknown }
  | { type: "error"; message: string };
