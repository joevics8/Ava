# Ava — communication & reliability review (9 Oct 2026)

Goal: Ava should be friendly **and** the place a user goes to understand her body.
This review is based on production data (Supabase), deploy state (Vercel), and the code.
No user health details are reproduced here.

## What was actually wrong

The bot was up and replying — nothing was crashing (no Vercel runtime errors, latest deploy READY).
The problems were in *what Ava said*, plus a few quiet reliability gaps.

| # | Problem | Why it happened | User-visible effect |
|---|---------|-----------------|---------------------|
| 1 | Chat had no idea where the user is in her cycle | `handleConversation` only received a log dump, never cycle data | Ava called a period "delayed" on the first day of the expected window |
| 2 | Late periods shown as "day 3, menstrual phase" | `getCurrentPhase` wraps the day count with modulo; `/today` also rolled the prediction forward a month | A late user was told she was on her period |
| 3 | Alert said "3 days late" when she was ~1 day past her likely date | Cron anchored lateness to the *start* of the window, not the most likely date | False "you're late" nudges |
| 4 | Short replies logged as new symptoms | Classifier saw each message in isolation | "Just more frequent" saved as a flow entry and answered as a log |
| 5 | "You logged this a month ago" that wasn't true | Pattern lookup matched Ava's own chat tags and filler words ("frequent", "increased") | Fabricated history |
| 6 | Ava dodged the user's own explanation of a delay, then added an unrelated food tip | The honesty rule was absolute ("say exactly 'I'm not sure why'. Nothing more.") and the food rule leaked into every reply | Unhelpful, off-topic answer |
| 7 | Pregnancy questions got no timing guidance | No reference facts in the prompt | No "when is a test reliable", no red flags |
| 8 | A real question could be replaced by a sales pitch | Premium upsell returned *instead of* answering | Question ignored |
| 9 | Failures were disguised | Empty AI result became "I'm here — tell me more" and was saved as Ava's reply | Outages invisible to user and logs |
| 10 | Cycle length never learned | `avg_cycle_length` stayed at the onboarding guess forever | Predictions drifted from reality |
| 11 | "yes" could be hijacked | `onboarding_step = 85` ("did it start?") never expired | A "yes" days later could log a false period start |
| 12 | Possible mid-reply cut-off | Webhook ran 4–6 sequential Gemini calls in `waitUntil` with no `maxDuration` | Intermittent "Ava stopped replying" |

## What changed

**Ava now knows the user's body state** (`lib/ava/body-context.ts`)
- Every reply gets a computed `CYCLE POSITION` (cycle day, phase, expected window, *late / not late*) and dated `RECENT LOGS`, flagged as ground truth.
- Late periods are tracked honestly (`getCycleStatus`): no wrap-around; a very old last period is treated as "probably missing data — ask", not "late".

**Answers explain, not just soothe** (`lib/ava/ai.ts`)
Every answer follows: direct answer → *why* tied to her cycle → typical vs not → one next step → at most one question.
- Engages with the user's own theory instead of dodging it, without asserting causes as fact.
- Built-in reference facts: pregnancy-test timing, overlap of early-pregnancy and pre-period symptoms, normal cycle variation, what can delay a period, emergency-contraception windows.
- Explicit emergency red flags (e.g. possible ectopic pregnancy, heavy bleeding).
- Food tips only when relevant.

**Better check-ins**
- "Did your period start?" replies now say where she is against her window; "not yet" explains test timing when she is genuinely late.
- Late-period alerts at +3 and +7 days past the likely date, with useful guidance and a yes/no hook.
- `/today` and the morning digest show lateness instead of a wrapped day.
- New users get a clearer welcome and example questions to ask.

**Reliability**
- Gemini model fallback; honest failure message; nothing fake saved to history.
- Classifier sees the previous turn.
- Answer first, upsell after (with a real button).
- `maxDuration = 60` on the webhook; step-85 flag clears when she moves on.
- Cycle length is learned from real gaps (21–45 days), with a wider window for irregular cycles.

## Not changed — worth your decision

1. **Fertile-window math.** `predictOvulationWindow` is fed the *start* of the period window (likely date − 2), so ovulation lands ~2 days early; and the window is ovulation −2…+1, while the standard fertile window is roughly ovulation −5…+1. This matters most for users whose goal is "avoid pregnancy". Left alone because it changes core predictions and alert timing.
2. **Secrets.** `.env.example` contains a real-looking `CRON_SECRET`, and cron routes take it as a query parameter. If the repo is public, rotate it. Also rotate any GitHub token that was pasted into chat.
3. **Cron scheduling is external (cron-job.org).** Nothing in the repo or Vercel config shows whether it is still firing; check that dashboard.
4. **Vercel Hobby** keeps only 1 hour of runtime logs, which makes bugs like this hard to diagnose after the fact. The existing admin Telegram alert helps; consider a log drain.
5. **`gemini-3-flash-preview`** is a preview model. Fallback now covers it, but pin a stable model when one is available.
6. Two empty stray files (`next`, `nextjs@0.1.0`) are committed at the repo root.
