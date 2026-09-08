# NorieDigi Digital Product Generator

A repeatable system that researches what is selling, generates the product, packages it for sale, and ships a launch kit with it. Goal: take an idea to a sellable product in five working days, then sell it faster than a cold launch would.

This folder is designed to become its own repository (`noriferamales27-cell/digital-product-generator`). Until that repo exists it lives here.

## Contents

| File | What it is |
|---|---|
| `PLAN.md` | The full plan: what the generator is, how it works, what to build first, and the 30/60/90 roadmap |
| `research/market-scan-2026-09.md` | What is selling in 2026, price bands, platforms, and where NorieDigi has an edge |
| `catalog/backlog.md` | Scored product backlog (ICE) with the first five products to ship |
| `marketing/launch-playbook.md` | The sell-faster playbook: funnel, pre-launch, launch week, post-launch ladder |

## Moving this into its own repo

1. On GitHub, create an empty private repo named `digital-product-generator` (no README).
2. From a clone of this branch, run:

```
git subtree split --prefix=product-generator -b product-generator-split
git push git@github.com:noriferamales27-cell/digital-product-generator.git product-generator-split:main
```

Or tell Claude the repo exists and it will do the split and push.
