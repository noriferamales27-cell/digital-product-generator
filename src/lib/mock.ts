import type { AudienceResult, LaunchResult, PlanTurn, ResearchResult } from "./schemas";

// Canned data so the UI can be developed and demoed without spending API calls.

export const mockResearch = (category: string): ResearchResult => ({
  category,
  summary: `Mock data for "${category}". In this category, template packs and short practical guides sell best. Buyers pay for something they can use the same day. Reviews complain that generic products need too much editing.`,
  best_platforms: ["Own site", "Gumroad", "Etsy"],
  opportunities: [
    {
      name: "Onboarding Checklist Pack for Small Teams",
      category: "HR templates",
      format: "template pack",
      audience: "Owners of 10 to 50 person companies without an HR manager",
      promise: "A new hire's first two weeks planned in an afternoon",
      price_low: 19, price_high: 39, currency: "USD",
      demand_signal: "Mock: 1,200+ Etsy listings for onboarding templates, top sellers with 300+ reviews",
      competition: "Many generic checklists. Few are written for owners doing HR themselves.",
      gap: "Written for a founder, not an HR department. Includes the messages to send, not just the tasks.",
      why_now: "Mock: September hiring season, owners search for onboarding help",
      time_to_create_hours: 3,
      ice: { impact: 8, confidence: 8, ease: 9, total: 25 },
      evidence: [
        { title: "Etsy search: onboarding checklist", url: "https://www.etsy.com/search?q=onboarding+checklist", note: "Mock evidence" },
        { title: "Reddit r/smallbusiness onboarding thread", url: "https://www.reddit.com/r/smallbusiness/", note: "Mock evidence" },
      ],
    },
    {
      name: "AI Prompt System for Client Emails",
      category: "AI prompt packs",
      format: "prompt pack",
      audience: "Freelancers and virtual assistants handling client inboxes",
      promise: "Reply to any client email in under two minutes",
      price_low: 17, price_high: 27, currency: "USD",
      demand_signal: "Mock: prompt packs at $27 outsell single prompts on Gumroad",
      competition: "Hundreds of generic prompt lists. Few organised by real inbox situations.",
      gap: "Organised by situation (late payment, scope creep, bad news) with example output.",
      why_now: "Mock: prompt packs are a top Gumroad category this year",
      time_to_create_hours: 2,
      ice: { impact: 7, confidence: 8, ease: 9, total: 24 },
      evidence: [{ title: "Gumroad discover: prompts", url: "https://gumroad.com/discover?query=prompts", note: "Mock evidence" }],
    },
    {
      name: "Lead Tracker Spreadsheet with Follow-up Reminders",
      category: "Business templates",
      format: "spreadsheet",
      audience: "Solo consultants and coaches",
      promise: "Never lose a warm lead to a forgotten follow-up",
      price_low: 12, price_high: 24, currency: "USD",
      demand_signal: "Mock: lightweight CRM templates are a top-four template category",
      competition: "Crowded, but most are Notion-only and overbuilt.",
      gap: "Google Sheets, five columns, one follow-up formula. Done in ten minutes.",
      why_now: "Mock: lightweight CRMs are a top-four template category",
      time_to_create_hours: 2,
      ice: { impact: 6, confidence: 7, ease: 10, total: 23 },
      evidence: [{ title: "Notion Marketplace CRM templates", url: "https://www.notion.com/templates/category/crm", note: "Mock evidence" }],
    },
  ],
  avoid: ["Generic productivity planners (saturated)", "AI art bundles (race to the bottom on price)"],
});

export const mockAudience = (name: string): AudienceResult => ({
  buyer_profile: {
    who: `Mock buyer for ${name}: a business owner doing admin at night`,
    job_to_be_done: "Get a repeatable process without hiring someone",
    trigger_moment: "A new hire starts on Monday and nothing is written down",
    objections: ["Will this fit my industry?", "Is it just a list I could write myself?"],
    language_they_use: ["I'm drowning in admin", "every onboarding is different", "there's no process, just me"],
  },
  channels: [
    { platform: "Facebook groups", why_here: "Owners ask for templates here weekly", where_exactly: ["Small Business Owners Network (mock)", "UAE Entrepreneurs (mock)"], content_angle: "Post the first three checklist items free", cta: "Full pack in comments", effort: "low", priority: 1 },
    { platform: "LinkedIn", why_here: "Founders of 10 to 50 person firms are active", where_exactly: ["#smallbusiness", "#peopleops", "search: 'onboarding checklist'"], content_angle: "Before and after of a messy first week", cta: "Link in profile", effort: "medium", priority: 2 },
    { platform: "Reddit", why_here: "Recurring threads asking for exactly this", where_exactly: ["r/smallbusiness", "r/Entrepreneur", "r/humanresources"], content_angle: "Answer the question fully, mention the pack once", cta: "DM for the link", effort: "low", priority: 3 },
  ],
  search_keywords: ["onboarding checklist template", "new hire checklist small business", "employee onboarding plan"],
  hooks: ["Your new hire's first week decides if they stay.", "I onboarded 200 people by hand. Here's the checklist."],
  outreach_messages: [{ context: "Reply to a group post asking for a template", message: "Here's the first three steps I use. If you want the full pack with the messages to send, I put it together as a download." }],
  posting_plan: "Mon LinkedIn post, Tue Facebook group value post, Thu Reddit answer, Fri LinkedIn story.",
  evidence: [{ title: "Mock source", url: "https://example.com", note: "Mock evidence" }],
});

export const mockProduct = (name: string): string => `# ${name}

Everything a new hire needs in their first two weeks, planned in one afternoon.

- Before day one
- Day one
- Week one
- Week two
- How to use this
- What to do next

## Before day one

**Checklist**

- [ ] Send the welcome message (template below)
- [ ] Set up email and tool access
- [ ] Assign a buddy

**Welcome message**

\`\`\`
Hi [Name], we're glad you're joining on [Date]. Your first day starts at [Time]. Bring your ID and we'll handle the rest. If you have questions before then, reply here.
\`\`\`

## Day one

- [ ] Tour and introductions
- [ ] Walk through the role, in writing
- [ ] Set the first-week goal

## Week one

Daily 15-minute check-in. Ask: what did you learn, what blocked you, what do you need.

## Week two

Hand over the first real task. Review it together on Friday.

## How to use this

Copy the checklists into your task tool. Fill in the [brackets] once and reuse them.

## What to do next

Save a copy per role. Update it after every hire.
`;

export const mockLaunch = (title: string): LaunchResult => ({
  product_name: title,
  tagline: "A new hire's first two weeks, planned in an afternoon",
  price: { launch: 19, regular: 29, currency: "USD", reasoning: "Mock: template packs sit at $19 to $39; launch price rewards the waitlist" },
  sales_page: {
    headline: "Your new hire's first week decides whether they stay.",
    subheadline: "The checklist and messages I use to onboard without an HR department.",
    problem: "Every onboarding is different because nothing is written down. The new hire waits, you scramble, and the first week sets the tone.",
    who_its_for: ["Owners of 10 to 50 person companies", "Managers who do HR on the side"],
    whats_inside: ["Before day one checklist", "Day one plan", "Week one and two check-ins", "Every message written out"],
    proof_placeholder: "Add one real buyer quote and one real before and after once you have them.",
    faq: [{ q: "Will it fit my industry?", a: "Yes. The steps are universal. You edit the [brackets] once." }],
    cta: "Get the pack",
  },
  listings: [
    { platform: "Gumroad", title: "Onboarding Checklist Pack for Small Teams", tags: ["onboarding", "checklist", "small business", "hr template"], description: "Mock listing description." },
    { platform: "Etsy", title: "Employee Onboarding Checklist Template Small Business New Hire Plan", tags: ["onboarding checklist", "new hire", "hr template", "small business", "employee onboarding", "welcome packet", "manager tools", "first week plan", "printable checklist", "editable template", "team onboarding", "startup hr", "people ops"], description: "Mock listing description." },
  ],
  emails: [1, 2, 3, 5, 7].map((day) => ({ day, subject: `Mock email day ${day}`, body: "Mock body. One link." })),
  posts: Array.from({ length: 8 }, (_, i) => ({ platform: i % 2 ? "LinkedIn" : "Facebook group", hook: "Your new hire's first week decides if they stay.", body: "Mock post body.", cta: "Link in profile" })),
  calendar: Array.from({ length: 30 }, (_, i) => ({ day: i - 13, action: i < 14 ? "Waitlist post" : i === 14 ? "Launch" : "Follow-up post" })),
  where_to_sell: [
    { platform: "Gumroad", role: "main store", upfront_cost: "free", why: "Free to list, live in 15 minutes, Discover feed brings some traffic", fee_note: "10% + 50c only when something sells", setup_minutes: 15, priority: 1 },
    { platform: "Payhip", role: "main store", upfront_cost: "free", why: "Free plan, lower fee than Gumroad, embeds on your own site", fee_note: "5% flat plus processing, only on sales", setup_minutes: 20, priority: 2 },
    { platform: "Etsy", role: "search channel", upfront_cost: "pay per listing", why: "Buyers search 'onboarding checklist' there daily", fee_note: "USD 0.20 per listing, then about 12 to 15% on a sale; UAE payouts via Payoneer", setup_minutes: 45, priority: 3 },
  ],
  upsell_path: "Bundle with the HR templates pack, then invite to a strategy call.",
});

export const mockPlanTurn = (name: string, turns: number, finish: boolean): PlanTurn => {
  const questions = [
    `Let's plan ${name} so it sells. First: what have you actually done that relates to this? One concrete story or number is enough.`,
    "Good, that goes in as a real example. Who exactly can you reach right now, and what do they say they struggle with?",
    "Useful. Do you already have anything we can build from: documents, checklists, past work?",
  ];
  if (!finish && turns < questions.length * 2) {
    const i = Math.floor(turns / 2);
    return { reply: questions[i], done: false, progress: (i + 1) / 4, plan: null };
  }
  return {
    reply: "That's enough to plan well. Here's the plan. Change anything, or create the product from it.",
    done: true,
    progress: 1,
    plan: {
      title: name,
      subtitle: "A new hire's first two weeks, planned in an afternoon",
      angle: "Written by someone who onboarded 200 people by hand, for owners who have no HR department",
      audience_detail: "Owners and managers of 10 to 50 person companies who do HR themselves",
      format: "template pack",
      length: "standard",
      outline: [
        { section: "Before day one", includes: ["Checklist", "Welcome message template", "Access setup list"] },
        { section: "Day one", includes: ["Agenda", "Role walkthrough template", "First-week goal template"] },
        { section: "Week one", includes: ["Daily check-in script", "Buddy guide"] },
        { section: "Week two", includes: ["First real task handover", "Friday review template"] },
        { section: "How to use this", includes: ["Copy into your task tool", "Fill brackets once"] },
      ],
      must_include: ["The visa paperwork mistake story", "Messages written out, not just tasks"],
      seller_experience_to_use: ["15 years HR in the UAE", "Onboarded 200 staff across a restaurant group"],
      differentiators: ["Written for a founder, not an HR department", "Every message included"],
      tone: "First person, plain, direct",
      price_suggestion: { launch: 19, regular: 29, currency: "USD" },
      bonuses: ["30-60-90 day review template"],
      risks: ["Generic feel: answered by the real story and UAE-specific wording"],
    },
  };
};
