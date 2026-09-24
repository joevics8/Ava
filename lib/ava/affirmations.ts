// ─── Affirmations library ───────────────────────────────────────────────────
//
// Text-only for now (audio is a later pass — same texts double as voice
// note scripts once TTS is wired up). Every affirmation is 5 lines, each
// line a distinct sentence — no line repeats verbatim within one
// affirmation (lesson from earlier iterations: repetition doesn't read as
// conviction, it reads as padding).

export interface AffirmationCategory {
  key: string;
  emoji: string;
  label: string;
  tagline: string;
  // Which underlying AFFIRMATIONS[] keys this menu button draws from. Menu
  // was trimmed from 12 buttons to 6 for length — content wasn't cut, the
  // related categories were pooled together instead (e.g. Stress,
  // Overthinking, Inner calm and Focus are all "help me settle down" asks
  // in practice, so one button now draws from all four pools).
  poolKeys: string[];
}

export const AFFIRMATION_CATEGORIES: AffirmationCategory[] = [
  { key: 'morning', emoji: '🌅', label: 'Morning', tagline: 'Start with intention', poolKeys: ['morning'] },
  { key: 'calm', emoji: '😌', label: 'Calm', tagline: 'Slow down and let go', poolKeys: ['stress', 'overthinking', 'inner_calm', 'focus'] },
  { key: 'self_worth_group', emoji: '💗', label: 'Self-worth', tagline: 'Believe in your value', poolKeys: ['confidence', 'self_worth', 'self_compassion'] },
  { key: 'growth_group', emoji: '🌱', label: 'Growth', tagline: 'Keep moving forward', poolKeys: ['growth', 'motivation'] },
  { key: 'sleep', emoji: '🌙', label: 'Sleep', tagline: 'End the day peacefully', poolKeys: ['sleep'] },
  { key: 'period_days', emoji: '🌸', label: 'Period days', tagline: 'Be gentle with yourself', poolKeys: ['period_days'] },
];

export const AFFIRMATIONS_INTRO =
  "🌸 *How affirmations work*\nPick a category and Ava will share a short affirmation — read it, or say it out loud like you're repeating after a friend. There's no right way to do it, just let the words land.";

// Underlying content pools — kept at the original 12 keys so none of the
// 105 affirmations had to be rewritten or dropped when the menu shrank to
// 6 buttons. AFFIRMATION_CATEGORIES above maps each visible button to one
// or more of these.
export const AFFIRMATIONS: Record<string, string[]> = {
  morning: [
`Some mornings call for quiet confidence, and this is one of them.
I don't need to feel ready to begin — starting is enough.
My voice matters, even when it shakes a little.
I trust the choices I've already made to get me here.
Today, I move forward like someone who believes in herself.`,
`Confidence isn't the absence of doubt — it's moving anyway.
I can feel unsure and still take the next step.
My track record speaks for itself, even on quiet days.
I don't need anyone's permission to trust my own judgment.
Today, I choose to act like I already belong here.`,
`I don't have to shrink to make others comfortable.
My opinions are allowed to take up space today.
I've earned the right to speak plainly about what I know.
Doubt can ride along, but it doesn't get to drive.
Today, I stand a little taller in what I know to be true.`,
`Today, I remind myself that I've handled hard rooms before.
Nervousness and readiness can exist in me at the same time.
I don't need external proof to know my own worth.
Every time I've bet on myself, something in me grew.
Today, I bet on myself again.`,
`I don't need to compare my confidence to anyone else's.
Mine is quieter, and that's still real.
I trust the parts of me that have carried me this far.
Today isn't about being fearless — it's about showing up anyway.
I choose to walk into today steady, not perfect.`,
`Today, I remember that saying no is also a full sentence.
I don't owe anyone an explanation for protecting my time.
My limits are not an inconvenience — they're information.
People who respect me will respect my boundaries too.
Today, I choose myself without guilt.`,
`Not every request deserves an automatic yes from me.
I can care about someone and still say no to them.
My energy is a resource, not an infinite supply.
Today, I check in with myself before I commit to anything.
I protect my peace the same way I'd protect someone I love.`,
`Today, I let go of the fear that boundaries make me difficult.
Clear limits actually make relationships easier, not harder.
I don't need to justify what I'm no longer available for.
My "no" today makes room for a real "yes" tomorrow.
I choose boundaries as an act of self-respect, not rejection.`,
`I'm allowed to change my mind about what I agreed to.
Today, I give myself permission to renegotiate what isn't working.
Protecting my time isn't selfish — it's necessary.
I don't have to earn the right to rest or decline.
Today, my boundaries are simply part of how I care for myself.`,
`Some things in my life are still taking shape, and that's alright.
I don't need every answer to trust the process I'm in.
Growth rarely looks dramatic while it's happening.
Today, I give myself room to be unfinished.
I trust that good things are often built slowly.`,
`Today, I choose patience over the urge to rush.
Not everything worth having arrives on my timeline.
I can want progress and still allow it to take time.
Waiting isn't wasted time — it's often where the real shift happens.
Today, I move steadily instead of frantically.`,
`I remind myself that most things worth doing take longer than expected.
Frustration doesn't speed anything up — it just adds weight.
Today, I choose to be patient with how long change takes.
I've been here before, and I got through it.
This, too, unfolds in its own time.`,
`Today, I release the pressure of an invisible deadline.
Nothing is wrong just because it's taking a while.
I can hold hope and patience in the same hand.
My timeline has never needed anyone else's approval.
I trust the pace my life is actually moving at.`,
`I've made it through every hard day I've ever had, without exception.
That is not luck — that is proof of something real in me.
Today may ask something of me, and I can meet it.
Setbacks don't erase how far I've already come.
I carry more strength into today than I usually give myself credit for.`,
`Hard weeks don't cancel out the progress underneath them.
I bend under pressure sometimes, but I don't stay bent.
Today, I choose to trust my own ability to recover.
Every difficult thing I've survived taught me something useful.
I am more resilient than the moments that have tested me.`,
`Today, I remember that struggling with something isn't the same as failing at it.
I'm allowed to find this hard and still keep going.
My strength doesn't always look loud or dramatic.
Quiet persistence counts just as much as visible progress.
I trust myself to keep showing up, even slowly.`,
`Whatever today brings, I've survived harder before.
I don't need to already know how I'll get through it.
Strength sometimes just looks like getting out of bed anyway.
Today, I choose to trust my own staying power.
I am someone who keeps going, even when it's difficult.`,
`Before the day gets busy, I pause to notice what's already good.
Small comforts count, even the ordinary ones.
I don't need a big reason to feel thankful today.
Gratitude doesn't require everything to be perfect first.
Today, I start by noticing what's already working in my life.`,
`Today, I choose to see what I have instead of what's missing.
Simple things — a roof, a meal, a quiet moment — are not nothing.
Appreciating my life doesn't mean pretending it's easy.
I can want more and still be thankful for now.
Today, gratitude is where I choose to begin.`,
`I take a moment to notice the people who show up for me.
Their care is not something I should take for granted.
Today, I let myself feel genuinely thankful for the good around me.
Even small kindnesses deserve to be noticed.
I choose appreciation as part of how I start my day.`,
`Today, I remember that my body carried me through yesterday, and it's here again today.
That alone deserves a quiet thank you.
Gratitude doesn't erase hard things — it just makes room for good ones too.
I choose to notice one thing that's going right.
Today begins with appreciation, not comparison.`,
`Today, taking care of myself is not an indulgence — it's maintenance.
I don't need to earn rest through exhaustion first.
Small acts of care add up, even the five-minute ones.
I deserve the same attentiveness I give to everyone else.
Today, I choose one small thing that's just for me.`,
`My needs are not less important because they're quiet.
Today, I check in with myself before I pour out to everyone else.
Caring for myself isn't selfish — it's what makes the rest possible.
I don't need permission to prioritize my own wellbeing.
Today, I treat myself like someone worth looking after.`,
`Today, I choose to listen to what my body and mind are asking for.
Ignoring my limits hasn't ever actually made me stronger.
A little rest, water, or quiet can be enough for now.
I don't need a crisis to justify caring for myself.
Today, self-care is simply part of my plan, not an afterthought.`,
`I remind myself that slowing down is not the same as falling behind.
Today, I give myself the same grace I'd give a friend.
My wellbeing matters, even on ordinary, unremarkable days.
I don't have to wait until I'm depleted to rest.
Today, I choose to care for myself before I'm forced to.`,
`I don't have today fully figured out, and that's okay.
Uncertainty doesn't mean something has gone wrong.
I can take the next right step without seeing the whole staircase.
Today, I choose to trust myself through the not-knowing.
Clarity often comes after I move, not before.`,
`Not knowing what happens next doesn't mean I'm unprepared.
Today, I let go of needing a guarantee before I try.
I've navigated uncertainty before, even when it felt unbearable.
My ability to adapt matters more than having every answer.
Today, I walk forward without needing to see the whole path.`,
`Today, I make peace with the questions I can't yet answer.
Some things reveal themselves slowly, in their own time.
I don't have to solve my whole future before lunch.
Uncertainty and calm can exist together, even briefly.
Today, I choose steadiness over needing to know everything.`,
`I remind myself that unclear doesn't mean unsafe.
Today, I allow some things to stay unresolved without panic.
My footing doesn't depend on having every detail worked out.
I trust that I'll know what to do when the moment comes.
Today, uncertainty is something I can carry lightly.`,
`Today can be a fresh page, regardless of how yesterday went.
I don't need a clean record to deserve a new start.
Old mistakes don't get a permanent seat at today's table.
I'm allowed to begin again as many times as I need to.
Today, I choose to start, not to be perfect from the outset.`,
`Whatever didn't work yesterday doesn't have to define today.
I release the story that one bad day means a bad pattern.
Today, I choose to begin exactly where I am.
Starting over isn't failure — it's often just honesty.
I give myself a real, clean chance at today.`,
`Today, I let go of needing to have gotten it right before.
Every new morning is an actual, real opportunity to reset.
I don't have to carry yesterday's weight into today's hours.
Beginning again is something I'm allowed to do without shame.
Today is its own separate chance.`,
`I remind myself that today isn't a continuation of a bad streak — it's its own day.
I can choose differently starting right now, no permission needed.
Old patterns don't automatically repeat themselves today.
I trust myself to make different choices when they matter.
Today, I begin again, plainly and without apology.`,
`Today, I choose to show up honestly in my relationships, not perfectly.
I don't have to earn love by being endlessly agreeable.
The people who matter can handle my real feelings.
I'm allowed to need things from the people close to me.
Today, I choose honesty over performing okay-ness.`,
`I remind myself that healthy connection includes disagreement sometimes.
Today, I don't have to smooth everything over just to keep the peace.
My relationships can hold a little friction without falling apart.
I choose to communicate instead of assuming I'll be misunderstood.
Today, I show up as myself, not a curated version.`,
`Today, I choose patience with the people I care about, and with myself.
Not every misunderstanding needs to become a fight.
I can hold love and frustration for the same person at once.
My relationships don't need to be flawless to be good.
Today, I lead with warmth where I can.`,
`I remind myself that I don't have to carry every relationship alone.
Today, I let someone else show up for me too.
Needing support doesn't make me a burden.
The right people want to be let in, not kept at a distance.
Today, I choose connection over quiet self-reliance.`,
`Today, I don't need to finish everything to consider it a good day.
Progress on one thing still counts as real progress.
I release the pressure to be endlessly productive.
My worth isn't tied to my output today.
I choose to do good work without sacrificing myself for it.`,
`Today, I trust myself to focus on what actually matters most.
Not every task deserves the same urgency.
I can do solid work without needing it to be flawless.
Today, effort is enough, even without a perfect result.
I show up for my work the same way I'd want to be shown up for.`,
`I remind myself that rest and ambition aren't opposites.
Today, I pace myself instead of burning through my energy by noon.
One task at a time is still real movement forward.
I don't need to prove my worth through overwork.
Today, I choose sustainable effort over urgency.`,
`Today, I trust that I know more than I give myself credit for.
Imposter feelings don't erase actual skill and experience.
I'm allowed to ask questions without it meaning I don't belong.
My work doesn't need to impress everyone to be valuable.
Today, I do my work and let that be enough.`,
`Today, I let rest be something I choose, not something I collapse into.
My body isn't a machine that owes constant output.
I don't need to justify slowing down with a good enough reason.
Rest today is not laziness — it's maintenance.
I choose to protect a little stillness for myself today.`,
`Today, I remind myself that productivity isn't the only measure of a good day.
A quiet, restful day still counts as time well spent.
I don't need permission to pause.
My energy deserves to be replenished, not just spent.
Today, I let myself simply rest without guilt.`,
`I remind myself that even small breaks are still real rest.
Today, I don't have to earn stillness through exhaustion first.
Doing less some days doesn't undo progress on other days.
I trust that rest today makes me steadier tomorrow.
Today, I choose to slow down on purpose.`,
`Today, I let go of the idea that busy equals worthy.
My value doesn't disappear the moment I stop moving.
I can enjoy doing nothing without needing to justify it.
Rest is part of the work, not separate from it.
Today, I give myself permission to simply be still.`,
`Today doesn't have to be extraordinary to be worth enjoying.
I choose to notice small, ordinary pleasures as they come.
I don't need a special occasion to feel good today.
Simple moments deserve my full attention too.
Today, I let myself actually enjoy being here.`,
`I remind myself that joy doesn't need to be earned through hard work first.
Today, I let myself laugh, rest, or wander without a reason.
Lightness is allowed, even on an ordinary Tuesday.
I don't have to wait for the "right" moment to feel good.
Today, I choose to enjoy what's actually in front of me.`,
`Today, I let curiosity lead more than obligation.
Something small today might surprise me, if I let it.
I don't need everything figured out to enjoy the day ahead.
Presence is its own kind of pleasure.
Today, I choose to actually be here for my own life.`,
`I remind myself that today is not just something to get through.
There is room in this day for something enjoyable, however small.
I don't need permission to feel good today.
Ease and delight are allowed, not just discipline and effort.
Today, I choose to notice what feels good, not just what needs doing.`,
`Today, I close my morning ritual with one simple truth: this day is mine to shape.
Whatever happens, I get to decide how I meet it.
I choose presence over rushing through the hours ahead.
Today has room for both effort and enjoyment.
I step into today, ready to actually live it.`,
  ],
  confidence: [
`I don't need to feel fearless to be confident — I just need to move anyway.
My opinions are valid, even when my voice shakes a little saying them.
I trust decisions I've made, even the ones that took courage.
Confidence grows every time I choose to try instead of shrink.
I believe in myself, one small brave choice at a time.`,
`I don't have to wait for permission to trust my own judgment.
My presence in a room is not something I need to apologize for.
I've handled things before that once felt impossible.
Self-doubt doesn't disqualify me from moving forward anyway.
I choose to believe in my own capability today.`,
`I am allowed to take up space with my ideas and my voice.
Confidence isn't arrogance — it's simply trusting myself.
I don't need everyone's approval to know my own worth.
Every challenge I've faced has quietly built something solid in me.
I believe in the person I've worked hard to become.`,
`I remind myself that competence doesn't require constant certainty.
I can feel nervous and still be genuinely capable.
My past effort has earned me the right to trust myself now.
I don't need to prove myself to everyone in the room.
I believe in myself, even in the moments I feel unsure.`,
`I choose to speak and act like someone who trusts herself.
Mistakes don't erase my ability — they refine it.
I don't need external validation to know I'm doing okay.
My confidence isn't dependent on getting everything right.
I believe in myself today, exactly as I am.`,
  ],
  focus: [
`Right now, I only need to focus on the next small step, not everything at once.
My attention is allowed to be steady instead of scattered.
I gently bring myself back each time my mind wanders.
One task at a time is enough for now.
I stay grounded in what's actually in front of me.`,
`I don't have to hold every thought in my head at once.
Focus isn't about perfection — it's about gently returning, again and again.
I choose to give this moment my full attention.
Distraction doesn't mean I've failed — it's just part of focusing.
I stay present with what matters most right now.`,
`I release the pressure to think about everything simultaneously.
My mind can settle into one thing at a time.
I trust myself to return to the task, even after drifting.
Staying grounded doesn't require rigid concentration — just gentle attention.
Right now, this is enough to focus on.`,
`I don't need a perfectly quiet mind to be focused.
Noticing distraction and coming back counts as focus too.
I choose to root myself in the present task, not every future one.
My attention is a skill I can practice, not something I either have or lack.
I stay grounded, one moment at a time.`,
`Today, I let go of trying to do five things at once.
Clarity comes from narrowing my attention, not widening it.
I trust that slowing down actually helps me focus better.
Each time I notice my mind drift, I simply guide it back.
I stay grounded in this one task, right now.`,
  ],
  stress: [
`I don't have to carry today's stress at full speed.
Slowing down isn't falling behind — it's staying sustainable.
I give myself permission to breathe before I react.
Not everything needs my urgent attention right now.
I choose to move through today a little more gently.`,
`Stress convinces me everything is urgent — it usually isn't.
I release the pressure to solve everything immediately.
My nervous system deserves a moment to settle.
I can slow my breathing, and my mind will follow.
Today, I choose calm over rushing.`,
`I don't need to earn rest by reaching my breaking point first.
Today, I give myself permission to pause before I'm forced to.
Stress doesn't disappear by pushing harder against it.
A few slow breaths can shift how today feels.
I choose ease wherever I actually have a choice.`,
`I remind myself that I can handle this without white-knuckling through it.
Slowing down doesn't mean I care less — it means I'm sustainable.
My body deserves relief, not just endurance.
I release tension I've been holding without noticing.
Today, I choose to meet stress with steadiness, not panic.`,
`I don't have to prove my commitment through exhaustion.
Today, I allow myself to take this one moment at a time.
Stress is loud, but it isn't in charge of my choices.
I can care about something and still protect my calm.
I give myself full permission to slow all the way down.`,
  ],
  overthinking: [
`Not every thought deserves my full attention.
I release the pressure to solve every possibility in advance.
What's outside my control isn't mine to carry.
I can notice a worry without following it all the way down.
Today, I choose to let some things simply be unresolved.`,
`My mind can spiral without my permission, but it doesn't have to lead.
I gently set down thoughts that aren't actually helping me right now.
Overthinking doesn't protect me — it just exhausts me.
I choose to focus on what I can actually influence today.
The rest, I release.`,
`I don't need to have every outcome mapped out in advance.
Some uncertainty is simply part of being alive, not a problem to fix.
I let go of replaying conversations I can't change.
My energy is better spent here, in this moment.
Today, I choose peace over endless rehearsal.`,
`Not everything requires a decision right this second.
I release the urge to analyze every angle before I can rest.
My thoughts are not always facts, and I don't have to obey them all.
I choose to trust myself to handle things as they actually arrive.
Today, I set the spiral down.`,
`I remind myself that overthinking rarely changes the outcome — it just borrows peace from now.
I let go of what I genuinely cannot control today.
My job isn't to predict everything — it's to respond when it happens.
I choose stillness over rehearsing every worst case.
Today, some things get to stay unanswered.`,
  ],
  self_worth: [
`My worth was never something I had to earn through performance.
I am valuable exactly as I am, not just when I'm impressive.
Other people's opinions of me don't set my actual worth.
I don't need to be everything to everyone to matter.
Today, I remember that I am enough.`,
`I don't need achievements to justify my place in the world.
My value doesn't fluctuate based on how productive today is.
I am worthy of care on my hardest days, not just my best ones.
Comparison doesn't get to decide how much I'm worth.
Today, I choose to believe in my own value.`,
`I am more than the roles I play for other people.
My worth isn't measured by how much I give before I run dry.
I don't have to shrink myself to be easier to accept.
Today, I remind myself that I matter, simply by existing.
No one else gets to determine my value for me.`,
`I release the belief that I have to be flawless to be worthy of love.
My mistakes don't disqualify me from being valuable.
I am allowed to take up space without justifying it.
Today, I choose to speak to myself like someone worth respecting.
My worth was never up for debate.`,
`I don't need anyone's validation to know that I matter.
Today, I remember the ways I've shown up for others and for myself.
My value isn't something that can be taken away by one hard day.
I am worthy of good things, simply because I exist.
Today, I hold onto my own worth a little more firmly.`,
  ],
  growth: [
`I don't have to be finished growing to be proud of how far I've come.
Small steps today still count as real movement.
Growth is rarely a straight line, and that's alright.
I trust that who I'm becoming is worth the effort.
Today, I choose progress over standing still.`,
`I release the pressure to have already arrived somewhere.
Every version of me has taught me something the next version needed.
I don't need to rush becoming who I'm meant to be.
Today, I take one more step, even if it's small.
Growth doesn't require certainty — just willingness.`,
`I remind myself that discomfort is often just growth in disguise.
I don't need to have it all figured out to keep moving.
Setbacks are part of growing, not proof that I've failed at it.
Today, I choose to keep building, even slowly.
The person I'm becoming is worth the patience it takes.`,
`I trust that I am not the same person I was a year ago, and that matters.
Today, I choose to keep stretching, even when it's uncomfortable.
Growth doesn't always feel good while it's happening.
I don't need permission to keep evolving.
I move forward today, even one small step at a time.`,
`I release the idea that I should already be further along.
My pace of growth is my own, and it's valid.
I choose to learn from today instead of judging myself for it.
Every effort I make today adds to who I'm becoming.
Today, I keep moving forward, on my own terms.`,
  ],
  self_compassion: [
`I don't have to be my own harshest critic to hold myself accountable.
Today, I choose the same gentleness I'd offer a friend.
Mistakes don't require self-punishment to be corrected.
I am allowed to be a work in progress and still be kind to myself.
Today, I speak to myself with more patience.`,
`I release the belief that criticism is what motivates me best.
Kindness toward myself is not the same as letting myself off easy.
I can hold high standards and still be gentle about how I meet them.
Today, I choose compassion over self-judgment.
I deserve the grace I so easily give to others.`,
`I don't need to earn rest or kindness through suffering first.
Today, I let go of the harsh inner voice, even briefly.
I am allowed to comfort myself the way I would comfort someone I love.
My struggles don't make me weak — they make me human.
Today, I choose gentleness with myself.`,
`I remind myself that self-compassion isn't self-indulgence.
Today, I forgive myself for not having it all figured out.
Being hard on myself has never actually made me better, only more tired.
I choose to meet my own struggles with softness instead of shame.
Today, I treat myself like someone worth being kind to.`,
`I don't have to hide the parts of myself that feel imperfect.
Today, I hold my own flaws with more patience than usual.
Compassion for myself makes room for real change, not just guilt.
I am doing my best with what I know right now.
Today, I choose to be gentle with myself.`,
  ],
  sleep: [
`Today is done, and I don't need to carry it into the night.
Whatever didn't get finished can wait until tomorrow.
I release the tension in my body, one breath at a time.
I don't need to solve anything else tonight.
I let myself rest, fully and without guilt.`,
`I remind myself that rest is not something I have to earn at the end of a long day.
Tonight, I let go of the thoughts still circling from today.
My body has done enough for now — it's allowed to be still.
I trust that tomorrow will hold what it needs to hold.
Tonight, I choose peace over replaying the day.`,
`I release today's weight, gently, one thought at a time.
There is nothing left I need to fix before I sleep.
My mind is allowed to slow down, even if it takes a moment.
I trust myself to handle tomorrow when it comes.
Tonight, I let myself simply rest.`,
`Today asked a lot of me, and I showed up for it.
Now, I give myself permission to close the day fully.
I don't need to review everything before I can relax.
My body is safe and supported right now.
I let myself drift toward sleep, without holding onto today.`,
`I remind myself that unfinished things will still be there tomorrow, calmly waiting.
Tonight isn't the time to solve them.
I release the tightness in my shoulders and let my breathing slow.
I've done enough for today, and that is genuinely enough.
I let myself rest peacefully tonight.`,
  ],
  period_days: [
`Today, my body is doing quiet, real work, even if it feels heavy.
I don't need to perform like it's an ordinary day.
Discomfort today doesn't mean something is wrong with me.
I give myself permission to move slower than usual.
Today, I meet myself with extra gentleness.`,
`I release the pressure to push through today at full capacity.
My energy is allowed to be lower right now, without apology.
Rest today is not a weakness — it's exactly what's needed.
I trust that this phase will pass, like it always does.
Today, I choose comfort over forcing productivity.`,
`I don't need to explain why I need to slow down today.
My body deserves patience, not frustration, right now.
Cramping or fatigue doesn't mean I'm failing at anything.
I give myself full permission to rest when I need to.
Today, gentleness is exactly the right approach.`,
`I remind myself that today calls for softness, not high expectations.
Whatever I can manage today is genuinely enough.
My body isn't working against me — it's working hard for me.
I choose comfort, warmth, and rest wherever I can find them.
Today, I take care of myself first.`,
`I don't need to match my energy from other days of the month.
Today's pace is allowed to look different, and that's okay.
I trust my body's signals instead of overriding them.
Being gentle with myself today is not indulgent — it's necessary.
Today, I choose kindness toward my own body.`,
  ],
  motivation: [
`I don't need to feel fully motivated to take the next step.
Today, I choose to move even when momentum is low.
Small actions still count, even without a burst of inspiration.
I trust that starting often creates the motivation I was waiting for.
Today, I keep going, one small effort at a time.`,
`I remind myself that consistency matters more than intensity.
Today, I don't need a big leap — just the next small one.
Tiredness doesn't mean I have to stop completely.
I choose progress over waiting for the "right" moment.
Today, I keep moving, even slowly.`,
`I don't have to feel ready to begin — readiness often comes after starting.
Today, I choose to show up, even without full enthusiasm.
Every effort adds up, even the ones that don't feel remarkable.
I trust the process more than I trust my current mood.
Today, I keep going anyway.`,
`I release the idea that motivation has to come before action.
Today, I act first, and let the motivation catch up.
Small wins still build real momentum.
I don't need to feel unstoppable to take one more step.
Today, I choose to keep going.`,
`I remind myself why I started, even on days it feels harder.
Today, I choose effort over waiting for perfect conditions.
Progress doesn't require me to feel excited every single day.
I trust that showing up matters, even quietly.
Today, I keep going, steadily and on purpose.`,
  ],
  inner_calm: [
`I don't need everything around me to be calm for me to feel steady inside.
Today, I choose to find balance, even amid noise.
My peace doesn't depend on everything going right.
I can return to stillness, even after being pulled off balance.
Today, I choose calm as my starting point.`,
`I release the need to control everything in order to feel okay.
Today, my balance comes from within, not from my circumstances.
I can hold both effort and ease without needing extremes.
Calm isn't something I have to chase — I can simply choose it.
Today, I return to my center.`,
`I don't have to react to every disruption around me.
Today, I choose steadiness over being swept along by chaos.
My inner balance is mine to protect, regardless of what's happening outside.
I can pause and recenter whenever I need to.
Today, I choose calm over urgency.`,
`I remind myself that balance doesn't mean perfect evenness — it means returning gently.
Today, I allow myself to recalibrate whenever I feel off.
Peace is available to me, even in small doses.
I don't need everything resolved to feel grounded.
Today, I choose to come back to myself.`,
`I release the tension I'm holding onto without needing to.
Today, my calm is something I carry with me, not something I wait for.
I can find balance even in an unbalanced day.
My steadiness doesn't depend on anyone else's mood.
Today, I choose peace as my anchor.`,
  ],
};

// ─── Menu, selection, and daily rotation ────────────────────────────────────

type SendFn = (chatId: number, text: string, markdown?: boolean) => Promise<void>;
type SendWithKeyboardFn = (chatId: number, text: string, keyboard: any[][], markdown?: boolean) => Promise<void>;

export async function showAffirmationMenu(chatId: number, user: any, send: SendFn, sendKb: SendWithKeyboardFn): Promise<void> {
  const { getMemoryContext, addMemoryLog } = await import('./db');
  const memoryLogs = await getMemoryContext(user.id, user.plan);
  const usedBefore = memoryLogs.some((l: any) => l.category === 'insight' && l.summary?.startsWith('Used /affirmations'));
  if (!usedBefore) {
    await send(chatId, AFFIRMATIONS_INTRO, true);
    await addMemoryLog(user.id, 'insight', 'Used /affirmations');
  }

  const keyboard = AFFIRMATION_CATEGORIES.map(c => [{ text: `${c.emoji} ${c.label} — ${c.tagline}`, callback_data: 'aff_' + c.key }]);
  keyboard.push([{
    text: user.affirmations_enabled ? '🔕 Turn off daily affirmations' : '🔔 Turn on daily affirmations',
    callback_data: user.affirmations_enabled ? 'aff_toggle_off' : 'aff_toggle_on',
  }]);
  await sendKb(chatId, '💬 *Pick an affirmation category:*', keyboard, true);
}

export async function handleAffirmationCallback(
  chatId: number,
  user: any,
  callbackData: string,
  send: SendFn
): Promise<boolean> {
  if (callbackData === 'aff_toggle_on' || callbackData === 'aff_toggle_off') {
    const { updateUser } = await import('./db');
    const enabled = callbackData === 'aff_toggle_on';
    await updateUser(user.telegram_id, { affirmations_enabled: enabled } as any);
    await send(chatId, enabled
      ? "Daily affirmations are on 🌸 You'll get one each morning."
      : 'Daily affirmations are off. You can turn them back on anytime from /affirmations or /settings.'
    );
    return true;
  }

  if (!callbackData.startsWith('aff_')) return false;
  const key = callbackData.replace('aff_', '');
  const category = AFFIRMATION_CATEGORIES.find(c => c.key === key);
  if (!category) return true;

  const pool = category.poolKeys.flatMap(k => AFFIRMATIONS[k] || []);
  if (!pool.length) return true;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  await send(chatId, pick);
  return true;
}

// Deterministic day-of-year rotation for the automated daily morning push —
// same affirmation for everyone on a given day, cycling through all 50
// before repeating (~7 weeks). Simple and good enough; a per-user shuffle
// can be added later if repeats become noticeable.
export function getDailyMorningAffirmation(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const pool = AFFIRMATIONS.morning;
  return pool[dayOfYear % pool.length];
}
