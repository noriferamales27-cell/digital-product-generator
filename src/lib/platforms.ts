/**
 * Publishing guide per platform. Static knowledge so choosing where to publish
 * costs no API call. Ordered free-first. Facts as of September 2026.
 */
export type Platform = {
  key: string;
  name: string;
  upfront: "free" | "pay per listing" | "monthly fee";
  feeOnSale: string;
  payout: string;
  bestFor: string;
  setupMinutes: number;
  url: string;
  steps: string[];
  listingTips: string[];
};

export const PLATFORMS: Platform[] = [
  {
    key: "gumroad",
    name: "Gumroad",
    upfront: "free",
    feeOnSale: "10% + 50c per sale, nothing until you sell",
    payout: "PayPal or bank transfer in 100+ countries",
    bestFor: "Fastest way to have a live product page today. Discover feed brings some free traffic.",
    setupMinutes: 15,
    url: "https://gumroad.com",
    steps: [
      "Create a free account at gumroad.com and confirm your email.",
      "Products, New product, choose Digital product. Paste the title and description from the launch kit.",
      "Upload the .docx or PDF you downloaded in Step 3. Add the cover image.",
      "Set the launch price. Turn on 'Allow customers to pay what they want' only for free lead magnets.",
      "Add the tags from the listing so it shows in Gumroad Discover.",
      "Publish. Copy the product link into your posts and emails.",
      "Settings, Payments: add PayPal or bank details so payouts can start.",
    ],
    listingTips: ["Lead with the buyer's problem in the first line.", "First image is the cover, second shows a page inside.", "Keep the URL slug to the product name."],
  },
  {
    key: "payhip",
    name: "Payhip",
    upfront: "free",
    feeOnSale: "5% flat on the free plan plus PayPal or Stripe processing, only on sales",
    payout: "PayPal or Stripe, where available in your country",
    bestFor: "Same speed as Gumroad with half the fee. Embeds a Buy button on your own website.",
    setupMinutes: 20,
    url: "https://payhip.com",
    steps: [
      "Create a free account at payhip.com.",
      "Connect PayPal or Stripe under Settings, Payment details. You need one of them to sell.",
      "Products, Add new product, Digital product. Paste the title and description from the launch kit.",
      "Upload the product file and the cover image. Set the price.",
      "Add a short preview (first pages as PDF) so buyers can sample it.",
      "Publish, then copy the embed code to put a Buy button on your own site.",
    ],
    listingTips: ["Use the description's first 160 characters as a hook; that is what shows in search.", "Enable the affiliate option later for partners."],
  },
  {
    key: "kofi",
    name: "Ko-fi Shop",
    upfront: "free",
    feeOnSale: "5% on the free tier, 0% on Ko-fi Gold (paid)",
    payout: "PayPal or Stripe",
    bestFor: "Creators with a community; no algorithm, so you bring the traffic.",
    setupMinutes: 15,
    url: "https://ko-fi.com",
    steps: [
      "Create a free Ko-fi page and connect PayPal or Stripe.",
      "Open Shop, Add item, Digital download. Paste the listing copy.",
      "Upload the file, set the price, publish.",
      "Share the shop link in your bio and posts.",
    ],
    listingTips: ["Ko-fi buyers respond to a personal note in the description."],
  },
  {
    key: "notion",
    name: "Notion Marketplace",
    upfront: "free",
    feeOnSale: "Free to list; checkout runs through Gumroad or Payhip, so their fee applies",
    payout: "Follows the checkout tool",
    bestFor: "Notion templates only. Free discovery from people searching inside Notion.",
    setupMinutes: 40,
    url: "https://www.notion.com/templates",
    steps: [
      "Build the template in Notion and set the page to Share to web with Allow duplicate as template.",
      "Apply as a creator at notion.com/templates (approval can take days).",
      "Submit the template with the title, description, category, and cover image from the launch kit.",
      "Set it as paid and link the Gumroad or Payhip checkout.",
    ],
    listingTips: ["Show the template filled with example data, never empty.", "One clear use case per template."],
  },
  {
    key: "etsy",
    name: "Etsy",
    upfront: "pay per listing",
    feeOnSale: "USD 0.20 per listing, then 6.5% transaction + 3% + 25c processing, more if an offsite ad brought the sale",
    payout: "UAE sellers via Payoneer; Philippine sellers direct (4.5% + PHP 25 processing)",
    bestFor: "Search traffic for printables, planners, and templates. Buyers come to you, ranking takes reviews.",
    setupMinutes: 45,
    url: "https://www.etsy.com/sell",
    steps: [
      "Open a shop at etsy.com/sell. Have ID and a bank or Payoneer account ready.",
      "Add listing, Digital files. Paste the Etsy title and all 13 tags from the launch kit.",
      "Upload the file (PDF works best) and up to 10 images: cover, inside pages, a mockup.",
      "Set the price and publish. The USD 0.20 listing fee is charged now.",
      "Renew or refresh the listing after 4 months if it has not sold.",
    ],
    listingTips: ["The title is the buyer's search phrase, not a clever name.", "All 13 tags, all different, multi-word.", "Reviews drive rank: ask every buyer once."],
  },
  {
    key: "lemonsqueezy",
    name: "Lemon Squeezy",
    upfront: "free",
    feeOnSale: "5% + 50c per sale; handles VAT and sales tax for you",
    payout: "PayPal payouts in 200+ countries; account approval at signup",
    bestFor: "Selling worldwide without tax admin. Best once sales are regular.",
    setupMinutes: 30,
    url: "https://www.lemonsqueezy.com",
    steps: [
      "Apply for a store at lemonsqueezy.com and wait for approval.",
      "Products, New product, upload the file, paste the listing copy, set the price.",
      "Add the checkout link or embed to your site and posts.",
      "Connect PayPal for payouts.",
    ],
    listingTips: ["Use the hosted checkout link in emails; it converts better than a full page."],
  },
  {
    key: "whop",
    name: "Whop",
    upfront: "free",
    feeOnSale: "3% platform + 2.7% + 30c processing, about 6 to 7% all in",
    payout: "Bank and PayPal; payouts carry a fee",
    bestFor: "Courses, communities, memberships with a social feed. Not needed for a single template.",
    setupMinutes: 30,
    url: "https://whop.com",
    steps: [
      "Create a Whop account and a store.",
      "Add a product, choose Files or Course, upload and price it.",
      "Publish to the Whop marketplace and share the link.",
    ],
    listingTips: ["Bundle the file with a community or calls; that is what Whop buyers expect."],
  },
  {
    key: "kdp",
    name: "Amazon KDP",
    upfront: "free",
    feeOnSale: "35% or 70% royalty depending on price band; no email capture",
    payout: "Bank transfer in supported countries",
    bestFor: "Ebooks only. Amazon search traffic, low prices, no relationship with the buyer.",
    setupMinutes: 90,
    url: "https://kdp.amazon.com",
    steps: [
      "Create a KDP account with tax and bank details.",
      "Format the manuscript (the .docx from Step 3 works) and make a 1600 x 2560 cover.",
      "Create a Kindle eBook, paste the title, description, and 7 keywords, pick 2 categories.",
      "Set the price (USD 2.99 to 9.99 for 70% royalty) and publish. Review takes up to 72 hours.",
    ],
    listingTips: ["The description is HTML; use short paragraphs and bold the promise."],
  },
];

export function platformByName(name: string): Platform | undefined {
  const n = name.toLowerCase();
  return PLATFORMS.find((p) => n.includes(p.key) || n.includes(p.name.toLowerCase().split(" ")[0]));
}
