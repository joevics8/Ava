import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, ChevronDown, Send } from 'lucide-react';
import { blogPath, hubPath, toolPath, SITE } from '@/lib/site';
import { listPosts } from '@/lib/blog';
import { toolsFor } from '@/lib/tools/registry';
import { cyclePhases } from '@/lib/cycle-ring';
import { faqLd, graphLd, homeGroup, pageMetadata, webPageLd } from '@/lib/seo';
import { CycleRing } from '@/components/site/CycleRing';
import { JsonLd, PageShell } from '@/components/site/PageShell';
import { TelegramCta } from '@/components/site/TelegramCta';
import { TelegramLink } from '@/components/site/TelegramLink';

const TITLE = 'Ava: AI Period Tracker & Cycle Companion on Telegram';
const DESCRIPTION = 'Track your period, ovulation and symptoms by chatting on Telegram. Ava learns your cycle, remembers your patterns and answers questions. Free to start.';

export const metadata: Metadata = {
  ...pageMetadata({ lang: 'en', path: '/', title: TITLE, description: DESCRIPTION, group: homeGroup() }),
  // The root layout adds " | Ava" to titles; this one already starts with the brand.
  title: { absolute: TITLE },
};

// Static page, regenerated hourly so the latest-articles row stays fresh. The referral
// code (?ref=) is applied in the browser by <TelegramLink>, which is what lets this page be cached.
export const revalidate = 3600;

const FEATURES = [
  {
    title: 'Predicts your period and fertile window',
    body: 'Ava works out your next period, your ovulation day and your fertile window from your own dates, then sharpens the estimate as you log more cycles.',
  },
  {
    title: 'Remembers your symptoms and mood',
    body: 'Mention cramps, headaches or a low mood while you chat. Ava logs it, spots patterns across cycles and brings them up when they matter.',
  },
  {
    title: 'Answers questions in plain language',
    body: 'Ask why your cycle changed, whether a symptom is common, or what your body is doing today. No jargon, and no lecture when you only wanted a quick answer.',
  },
  {
    title: 'Suggests natural home remedies',
    body: 'A library of home remedies for everyday problems like cramps, bloating, poor sleep and skin trouble. The first remedy for each condition is free.',
  },
  {
    title: 'Plans food around your energy',
    body: 'Get meal ideas that fit your country, your diet, your budget and how much you feel like cooking, with suggestions for the days your energy dips.',
  },
  {
    title: 'Supports calm and pregnancy',
    body: 'Short guided meditations and daily affirmations for stressful days, plus a pregnancy mode with a weekly note on how your baby is growing.',
  },
] as const;

const STEPS = [
  { title: 'Open Ava on Telegram', body: 'Tap the button and press Start. Ava is a Telegram bot, so there is nothing to install and no new account to make.' },
  { title: 'Answer a few questions', body: 'Share the first day of your last period, your usual cycle length and your country. That is enough for Ava to start predicting.' },
  { title: 'Just chat', body: 'Log symptoms, ask questions or ask for a remedy. Ava replies like a friend and remembers it all the next time you write.' },
] as const;

const PHASES = [
  {
    key: 'period', name: 'Menstrual phase', color: 'border-phase-period',
    body: 'Day one is the first day of bleeding. The uterus sheds its lining and hormone levels are at their lowest. Cramps, tiredness and a low mood are common. Most periods last three to seven days.',
  },
  {
    key: 'follicular', name: 'Follicular phase', color: 'border-phase-follicular',
    body: 'Rising oestrogen thickens the uterine lining while follicles in the ovary mature. Many people notice more energy, clearer skin and a better mood as this phase goes on.',
  },
  {
    key: 'ovulation', name: 'Ovulation', color: 'border-phase-ovulation',
    body: 'An egg is released, usually about 14 days before the next period. The fertile window is the five days before ovulation, ovulation day and the day after. Some people feel a mild twinge on one side.',
  },
  {
    key: 'luteal', name: 'Luteal phase', color: 'border-phase-luteal',
    body: 'Progesterone rises. If there is no pregnancy, hormones fall again and the next period begins. Bloating, sore breasts, cravings and mood changes often appear in the days before it.',
  },
] as const;

const FREE_PLAN = ['Full onboarding and cycle tracking', 'AI chat: ask Ava anything', 'Symptom and mood logging', '2 weeks of memory'];
const PREMIUM_PLAN = ['Everything in Free', '5 months of memory', 'Morning daily digest', 'Ovulation test strip reading', 'Monthly cycle PDF report'];

const FAQS = [
  {
    q: 'What is Ava?',
    a: 'Ava is an AI period and cycle tracker that lives inside Telegram. You chat with her like a friend: she tracks your cycle, remembers your symptoms and mood, and explains what is happening in your body in plain language.',
  },
  {
    q: 'Is Ava free?',
    a: 'Yes, you can start free. The free plan includes cycle tracking, AI chat, symptom and mood logging, and two weeks of memory. Premium costs ₦2,000 a month and adds five months of memory, a morning digest, ovulation test strip reading and a monthly PDF report.',
  },
  {
    q: 'Do I need to download an app?',
    a: 'No. Ava works inside Telegram, which you may already have on your phone. Open the bot, press Start and begin. The free calculators on this site work in any browser without an account.',
  },
  {
    q: 'How does Ava predict my period and ovulation?',
    a: 'Ava starts from the first day of your last period and your usual cycle length. Ovulation usually falls about 14 days before the next period, and the fertile window runs from five days before ovulation to the day after. Predictions improve as you log more cycles. They are estimates, not guarantees.',
  },
  {
    q: 'Is my health data private?',
    a: 'Ava stores your Telegram ID, the cycle dates and health notes you share, and short conversation summaries that power her memory. She never sells your data, never shares health information with advertisers and does not keep full chat transcripts. The calculators on this site run in your browser and save nothing.',
  },
  {
    q: 'Can Ava replace a doctor?',
    a: 'No. Ava shares general wellness information, not medical advice or a diagnosis. See a clinician if you have severe pain, very heavy bleeding, a period that stops unexpectedly, or any symptom that worries you.',
  },
  {
    q: 'How do I delete my data?',
    a: 'Message Ava “delete my data” on Telegram, or open your dashboard and choose Delete my account and data. Both remove your account and everything stored with it.',
  },
  {
    q: 'Does Ava work outside Nigeria?',
    a: 'Yes. Ava works anywhere Telegram does. During setup you tell her your country so food ideas and remedies suit where you live.',
  },
] as const;

function Section({ id, tone = 'paper', children }: { id?: string; tone?: 'paper' | 'wash'; children: React.ReactNode }) {
  return (
    <section id={id} className={tone === 'wash' ? 'bg-wash' : 'bg-paper'}>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">{children}</div>
    </section>
  );
}

function SectionHead({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h2>
      {intro && <p className="mt-3 text-lg leading-relaxed text-muted-ink">{intro}</p>}
    </div>
  );
}

export default async function HomePage() {
  const tools = toolsFor('en');
  const posts = await listPosts('en', 3);
  const spans = cyclePhases(28, 5);

  const ld = graphLd([
    webPageLd('/', TITLE, DESCRIPTION, 'en', { breadcrumb: false }),
    {
      '@type': 'SoftwareApplication', name: 'Ava', applicationCategory: 'HealthApplication', operatingSystem: 'Telegram',
      description: DESCRIPTION, url: SITE, inLanguage: 'en',
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'NGN' },
        { '@type': 'Offer', name: 'Premium', price: '2000', priceCurrency: 'NGN' },
      ],
    },
    faqLd(FAQS.map(f => ({ q: f.q, a: f.a }))),
  ]);

  const primaryBtn = 'inline-flex h-14 items-center whitespace-nowrap justify-center gap-2 rounded-full bg-marigold px-8 text-lg font-semibold text-ink transition-colors hover:bg-[hsl(39_92%_52%)] lg:px-6 lg:text-base';

  return (
    <PageShell lang="en" flush>
      <JsonLd data={ld} />

      {/* Hero */}
      <section className="on-deep bg-deep text-paper">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl">
              The AI period tracker you chat with on Telegram
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/85 sm:text-xl">
              Tell Ava how you feel. She tracks your cycle, remembers your symptoms and explains what is happening in your body in plain language.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <TelegramLink target="_blank" className={primaryBtn}>
                <Send className="h-5 w-5" aria-hidden="true" />
                Start free on Telegram
              </TelegramLink>
              <Link href={hubPath('en', 'tools')} prefetch={false}
                className="inline-flex h-14 items-center justify-center whitespace-nowrap rounded-full border border-paper/40 px-7 text-lg font-medium text-paper hover:border-paper hover:bg-paper/10 lg:px-6 lg:text-base">
                Try the free calculators
              </Link>
            </div>
            <p className="mt-5 text-sm text-paper/75">Free to start. No app to download. Works on any phone with Telegram.</p>
          </div>

          <figure className="mx-auto w-full max-w-[22rem]">
            <CycleRing cycleLength={28} periodLength={5} day={14} tone="deep" animate
              top="Cycle day" main="14" bottom="Ovulation window" className="h-auto w-full" />
            <figcaption className="mt-4">
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-paper/85">
                {([['Period', 'bg-phase-period-on-deep'], ['Follicular', 'bg-phase-follicular-on-deep'], ['Ovulation', 'bg-phase-ovulation'], ['Luteal', 'bg-phase-luteal']] as const).map(([name, dot]) => (
                  <li key={name} className="flex items-center gap-2">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    {name}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-center text-xs text-paper/70">Example: day 14 of a 28-day cycle</p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* What Ava does */}
      <Section id="features">
        <SectionHead
          title="A cycle tracker that talks back"
          intro="Most period apps hand you a calendar. Ava is a conversation that remembers you, so the advice fits your body and your week." />
        <ul className="grid gap-x-14 md:grid-cols-2">
          {FEATURES.map(f => (
            <li key={f.title} className="border-t border-line py-6">
              <h3 className="font-display text-xl font-semibold leading-snug text-ink">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-ink">{f.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" tone="wash">
        <SectionHead title="Start tracking in three steps" />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden="true" className="font-display text-6xl font-bold leading-none text-primary/25">{i + 1}</span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-ink">{s.body}</p>
            </li>
          ))}
        </ol>
        <TelegramLink target="_blank" className={`${primaryBtn} mt-12`}>
          <Send className="h-5 w-5" aria-hidden="true" />
          Open Ava on Telegram
        </TelegramLink>
      </Section>

      {/* The four phases */}
      <Section id="cycle-phases">
        <SectionHead
          title="The four phases of your menstrual cycle"
          intro="Your cycle is more than your period. Four phases, driven by shifting hormones, change your energy, mood, appetite and fertility. Ava tracks which one you are in." />

        <div aria-hidden="true" className="mb-10 flex gap-1.5">
          {spans.map(s => (
            <div key={s.key} style={{ flexGrow: s.days }}
              className={`h-3 basis-0 rounded-full ${s.key === 'period' ? 'bg-phase-period' : s.key === 'follicular' ? 'bg-phase-follicular' : s.key === 'ovulation' ? 'bg-phase-ovulation' : 'bg-phase-luteal'}`} />
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map(p => {
            const span = spans.find(s => s.key === p.key)!;
            return (
              <article key={p.key} className={`border-t-4 pt-4 ${p.color}`}>
                <h3 className="font-display text-xl font-semibold text-ink">{p.name}</h3>
                <p className="mt-1 text-sm font-medium text-muted-ink">
                  {span.start === span.end ? `Day ${span.start}` : `Days ${span.start}–${span.end}`} of a 28-day cycle
                </p>
                <p className="mt-3 leading-relaxed text-ink/90">{p.body}</p>
              </article>
            );
          })}
        </div>

        <p className="mt-10 max-w-2xl leading-relaxed text-muted-ink">
          A typical cycle lasts 21 to 35 days, and the length can shift by a few days from month to month. The day numbers above are for a 28-day cycle with a five-day period. Yours may differ, which is why Ava uses your own dates.
        </p>
      </Section>

      {/* Free tools */}
      <Section id="tools" tone="wash">
        <SectionHead
          title="Free cycle calculators"
          intro="Work out your next period, your fertile window or your due date in seconds. They run in your browser, so nothing you enter is saved." />
        <ul className="grid gap-4 md:grid-cols-3">
          {tools.map(({ text }) => (
            <li key={text.slug}>
              <Link href={toolPath('en', text.slug)} prefetch={false}
                className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-colors hover:border-primary">
                <h3 className="font-display text-xl font-semibold text-ink group-hover:text-primary">{text.h1}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-muted-ink">{text.description}</p>
                <span className="mt-4 font-medium text-primary underline underline-offset-4">Use the calculator</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href={hubPath('en', 'tools')} prefetch={false} className="font-medium text-primary underline underline-offset-4">See all free tools</Link>
        </p>
      </Section>

      {/* Pricing */}
      <Section id="pricing">
        <SectionHead title="Free to start, Premium when you want more" intro="Everything you need to track your cycle and talk to Ava is free. Premium adds longer memory and extras." />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-line p-7 sm:p-8">
            <h3 className="font-display text-2xl font-bold text-ink">Free</h3>
            <p className="mt-3 font-display text-5xl font-bold tracking-tight text-ink">₦0</p>
            <ul className="mt-6 flex-1 space-y-3">
              {FREE_PLAN.map(item => (
                <li key={item} className="flex gap-3 text-ink">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-phase-follicular" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <TelegramLink target="_blank"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-primary font-semibold text-primary hover:bg-wash">
              Start free
            </TelegramLink>
          </div>

          <div className="on-deep flex flex-col rounded-2xl bg-deep p-7 text-paper sm:p-8">
            <h3 className="font-display text-2xl font-bold">Premium</h3>
            <p className="mt-3 font-display text-5xl font-bold tracking-tight">
              ₦2,000<span className="ml-1 text-lg font-medium text-paper/75">/month</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {PREMIUM_PLAN.map(item => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-marigold" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <TelegramLink target="_blank"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-marigold font-semibold text-ink hover:bg-[hsl(39_92%_52%)]">
              Get Premium
            </TelegramLink>
          </div>
        </div>
        <p className="mt-5 text-sm text-muted-ink">Cancel any time from Telegram.</p>
      </Section>

      {/* Latest articles (only when there are published posts) */}
      {posts.length > 0 && (
        <Section id="blog" tone="wash">
          <SectionHead title="Guides to your cycle and body" intro="Clear, practical reading on periods, ovulation, symptoms and wellbeing." />
          <ul className="grid gap-4 md:grid-cols-3">
            {posts.map(p => (
              <li key={p.slug}>
                <Link href={blogPath('en', p.slug)} prefetch={false}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-colors hover:border-primary">
                  <h3 className="font-display text-xl font-semibold leading-snug text-ink group-hover:text-primary">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 flex-1 leading-relaxed text-muted-ink">{p.excerpt}</p>}
                  {p.read_time && <p className="mt-4 text-sm text-muted-ink">{p.read_time} min read</p>}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href={hubPath('en', 'blog')} prefetch={false} className="font-medium text-primary underline underline-offset-4">Read all articles</Link>
          </p>
        </Section>
      )}

      {/* FAQ */}
      <Section id="faq" tone={posts.length > 0 ? 'paper' : 'wash'}>
        <SectionHead title="Questions about Ava" />
        <div className="max-w-3xl border-t border-line">
          {FAQS.map(f => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-muted-ink">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        <TelegramCta line="Ready to understand your cycle? Say hello to Ava." button="Start free on Telegram" />
        <p className="pb-2 text-sm text-muted-ink">
          Ava shares general wellness information, not medical advice. See a clinician for medical concerns.
        </p>
      </div>
    </PageShell>
  );
}
