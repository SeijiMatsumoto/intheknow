# Subscription Plans

## Pricing

| Plan | Monthly | Annual (per month) | Annual total |
|------|---------|-------------------|--------------|
| **Free** | $0 | $0 | $0 |
| **Plus** | $8/mo | $5/mo | $60/yr |
| **Pro** | $20/mo | $14/mo | $168/yr |

---

## Free

**Goal:** Hook users with a taste of the product. Every digest is a conversion opportunity.

### What's included

- **1 curated newsletter subscription**
- **Digest summary** — high-level overview of what happened
- **"In This Edition"** — key takeaways / bullet points
- **Section headings + article titles visible** — user sees exactly what's covered
- **Source links** — can click through to original articles (zero cost, keeps the product feeling generous)
- **AI analysis / quotes / "The Bottom Line" locked** — the unique value layer
- **Default delivery schedule only**
- **Standard digest length only**
- **No custom newsletters**

### Cost per free user

~1 Resend email per digest (~$0.0009/email). Digest generation is shared across all subscribers of a curated newsletter — no incremental LLM cost per free user. Content gating is purely a conversion lever.

**Estimated: ~$0.03/mo per free user**

---

## Plus

**Goal:** The core paid experience. Unlock everything that makes the product genuinely useful.

### What's included

- **Up to 10 curated newsletter subscriptions**
- **Full digest content** — AI analysis, quotes, context, "The Bottom Line"
- **Custom delivery schedule** — choose days and time per subscription
- **Digest length preference** — brief / standard / deep dive
- **Up to 2 custom newsletters** — weekly cadence only
- Source links (same as Free)

### What's NOT included (Pro only)

- Social consensus ("what people are saying" — Twitter/social commentary)
- Deep research (more sources, extended analysis, longer digests)
- Daily cadence on custom newsletters
- More than 2 custom newsletters

### Cost per Plus user

- Resend: 10 subs × ~4 digests/mo avg = ~40 emails → ~$0.04
- Custom newsletters (2 weekly): ~2 LLM runs/week = 8/mo → ~$0.40–1.60 (depends on model)
- **Estimated: ~$0.50–2.00/mo per Plus user**
- **Margin at $8/mo: ~75–94%**

---

## Pro

**Goal:** Power users, professionals, and teams. Maximum depth and flexibility.

### What's included

- **Unlimited curated newsletter subscriptions**
- **Full digest content** — everything in Plus
- **Social consensus** — "What people are saying" section sourced from Twitter/social, showing public reaction, hot takes, and sentiment around each story
- **Deep research** — more sources scraped, extended analysis, richer article breakdowns
- **Up to 5 custom newsletters** — daily or weekly cadence
- **Custom delivery schedule**
- **Digest length preference**

### Cost per Pro user

- Resend: heavy user ~20 subs, mix of daily/weekly → ~100 emails/mo → ~$0.09
- Custom newsletters (5, worst case all daily): 5 × 30 = 150 LLM runs/mo → $3–15
- Deep research: ~2x token usage per run
- Social consensus: Twitter API calls per run
- **Estimated: ~$5–22/mo per Pro user (worst case heavy user)**
- **Margin at $20/mo: varies. Average user ~70%, maxed-out user ~break-even**

---

## API & Service Pricing Reference

### OpenAI GPT-5.4 (prices per 1M tokens)

| Model | Input | Cached input | Output | Long input | Long cached | Long output |
|-------|-------|-------------|--------|------------|-------------|-------------|
| gpt-5.4 | $2.50 | $0.25 | $15.00 | $5.00 | $0.50 | $22.50 |
| gpt-5.4-mini | $0.75 | $0.075 | $4.50 | - | - | - |
| gpt-5.4-nano | $0.20 | $0.02 | $1.25 | - | - | - |

**Likely usage:** gpt-5.4-mini for standard digests, gpt-5.4 for deep research.

### Perplexity Sonar (prices per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| Sonar | $1.00 | $1.00 |
| Sonar Pro | $3.00 | $15.00 |

**Likely usage:** Sonar for sourcing/research step. Could replace or supplement RSS scraping.

### Resend

| Plan | Included | Overage |
|------|----------|---------|
| Pro ($20/mo) | 50,000 emails/mo | $0.90 per 1,000 |

**Per email: ~$0.0004 within plan, $0.0009 overage.**

At 1,000 users averaging 30 emails/mo = 30,000 emails → well within the $20/mo Resend plan.

### Twitter API (via twitterapi.io)

| Resource | Price |
|----------|-------|
| Tweets | $0.15 per 1K tweets |
| Profiles | $0.18 per 1K users |
| Followers | $0.15 per 1K followers |

**Per digest with social consensus:** ~100–500 tweets fetched → $0.015–0.075 per run.

### Inngest

Free tier covers 25K function runs/mo. At scale, $25/mo for 100K runs.

### Neon

Free tier covers small-medium usage. Pro at $19/mo for production.

---

## Per-Digest Cost Estimates

Assuming gpt-5.4-mini for standard, gpt-5.4 for deep research:

| Digest type | Input tokens | Output tokens | LLM cost | Twitter | Resend | Total per run |
|-------------|-------------|---------------|----------|---------|--------|---------------|
| Standard (curated, shared) | ~20K | ~5K | ~$0.04 | — | — | ~$0.04 |
| Standard (custom, weekly) | ~20K | ~5K | ~$0.04 | — | — | ~$0.04 |
| Deep research (Pro) | ~50K | ~15K | ~$0.35 | — | — | ~$0.35 |
| With social consensus (Pro) | +10K | +3K | +$0.02 | ~$0.05 | — | +$0.07 |
| Email send | — | — | — | — | $0.0009 | $0.0009 |

**Worst-case Pro user (5 daily customs + deep research + consensus):**
- 150 runs × ($0.35 + $0.07) = ~$63/mo in generation
- That exceeds $20/mo — but this is extreme. Cap mitigates: most Pro users won't run 5 daily deep-research newsletters.

**Typical Pro user (2 weekly customs + 10 curated subs):**
- 8 custom runs × $0.04 = $0.32
- ~40 emails × $0.0009 = $0.04
- **~$0.36/mo → 98% margin at $20/mo**

---

## Cost Model Summary

### Where the money goes

| Resource | Cost driver | Notes |
|----------|-------------|-------|
| LLM (OpenAI) | Writing each digest | Per newsletter run, NOT per user. Curated = shared. Custom = dedicated per user. |
| Perplexity Sonar | Research / sourcing | Could replace RSS scraping for better results. Per run. |
| Twitter API | Social consensus section | Pro only. ~$0.05 per run. |
| Resend | Email delivery | Per user per digest. ~$0.0009/email. |
| Inngest | Scheduled execution | Per newsletter run. Cheap. |
| Neon | Database | Shared. Cheap. |

### Real cost risks (all gated)

1. **Custom newsletters** — dedicated LLM run per newsletter. Capped: Plus=2, Pro=5.
2. **Daily cadence on customs** — 7x cost vs weekly. Pro only.
3. **Deep research** — uses gpt-5.4 instead of mini, ~9x token cost. Pro only.
4. **Social consensus** — Twitter API + additional LLM. Pro only.
5. **Worst-case Pro user** — could exceed subscription price. Consider usage-based overage or stricter caps if this becomes common.

### What doesn't save money (but drives conversion)

- Locking AI analysis on Free — the generation happened regardless (shared run). Purely conversion.
- Source links are free to serve — locking them would feel punishing.

---

## Feature Gating Summary

| Feature | Free | Plus ($8/mo) | Pro ($20/mo) |
|---------|------|-------------|-------------|
| Curated subscriptions | 1 | 10 | Unlimited |
| Digest summary | ✓ | ✓ | ✓ |
| Key takeaways ("In This Edition") | ✓ | ✓ | ✓ |
| Section headings + article titles | ✓ | ✓ | ✓ |
| Source links ("Read source →") | ✓ | ✓ | ✓ |
| AI analysis / detail / quotes | ✗ | ✓ | ✓ |
| "The Bottom Line" | ✗ | ✓ | ✓ |
| Custom delivery schedule | ✗ | ✓ | ✓ |
| Digest length preference | ✗ | ✓ | ✓ |
| Custom newsletters | ✗ | 2 (weekly) | 5 (daily or weekly) |
| Social consensus | ✗ | ✗ | ✓ |
| Deep research | ✗ | ✗ | ✓ |
| Daily cadence (custom) | ✗ | ✗ | ✓ |

---

## Locked Content UX (Free Digest View)

```
┌─────────────────────────────────────────┐
│  Newsletter Title                       │
│  Edition Title                          │
│  Date                                   │
│  Summary paragraph (visible)            │
├─────────────────────────────────────────┤
│  ⚡ In This Edition (visible)           │
│  • Takeaway 1                           │
│  • Takeaway 2                           │
│  • Takeaway 3                           │
├─────────────────────────────────────────┤
│  SECTION HEADING (visible)              │
│                                         │
│  "Article Title 1" — source, date  [→]  │
│  "Article Title 2" — source, date  [→]  │
│  "Article Title 3" — source, date  [→]  │
│                                         │
│  🔒 Unlock full analysis, quotes, and   │
│     AI commentary with Plus or Pro      │
│                                         │
│     [Upgrade]                           │
├─────────────────────────────────────────┤
│  🔒 The Bottom Line — paid plans only   │
└─────────────────────────────────────────┘
```

## Pro-Only Digest Sections

```
┌─────────────────────────────────────────┐
│  💬 What people are saying              │
│  (Social consensus from Twitter/X)      │
│                                         │
│  Summary of public reaction, hot takes, │
│  sentiment breakdown per story          │
├─────────────────────────────────────────┤
│  🔬 Deep research                       │
│  Extended analysis, additional sources, │
│  and richer article breakdowns          │
└─────────────────────────────────────────┘
```
