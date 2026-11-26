import type { Tool } from '../types';

export const tool: Tool = {
  id: 'breast-milk-storage-guide',
  category: 'baby',
  related: ['corrected-age-calculator', 'vaccination-schedule', 'lam-postpartum-fertility'],
  text: {
    en: {
      slug: 'breast-milk-storage-guide',
      title: 'Breast Milk Storage Guide and Discard-By Time',
      h1: 'Breast Milk Storage Guide: How Long Is It Safe?',
      description: 'How long can breast milk sit out, last in the fridge or freezer, or stay safe after thawing? Pick your milk and storage to get a discard-by time.',
      intro: 'Choose the state of your milk and where it is kept to see how long it is safe, with a discard-by time from when you expressed it. It uses the cautious figure from CDC, NHS, La Leche League and the Academy of Breastfeeding Medicine.',
      faqs: [
        { q: 'How long can breast milk sit out at room temperature?', a: 'Freshly expressed milk is safe for up to 4 hours at 25C or cooler, and some guidance allows up to 6 to 8 hours. In a hot room it spoils faster, so refrigerate it sooner.' },
        { q: 'How long does breast milk last in the fridge?', a: 'Up to 4 days is the cautious figure (CDC, ABM). The NHS says up to 5 days at 4C or colder, and La Leche League allows longer in very clean conditions. Keep it at the back of the fridge, not the door.' },
        { q: 'How long does breast milk last in the freezer?', a: 'Six months is best (CDC, NHS, ABM), and up to 12 months is acceptable. Milk stays safe longer but may lose some quality. Label each bag with the date.' },
        { q: 'How long is thawed breast milk good for?', a: 'In the fridge, use thawed milk within 24 hours of it being fully thawed, not from when it was expressed. If it has been brought to room temperature, use it within about 2 hours.' },
        { q: 'Can I refreeze breast milk?', a: 'No. Never refreeze milk that has fully thawed. Milk that still has ice crystals can go back in the freezer, for example after a power cut.' },
        { q: 'What do I do with leftover milk from a feed?', a: 'Use it within 1 to 2 hours of the end of the feed (we use 1 hour to be cautious), then throw it away. Baby\'s saliva adds bacteria, so leftover milk cannot be stored again.' },
        { q: 'How do I keep breast milk safe during a power cut?', a: 'Keep the fridge and freezer doors shut. A full freezer stays frozen for about 48 hours and a fridge stays cold for about 4 hours. After that, move milk to a cooler with frozen ice packs.' },
        { q: 'How do I tell if breast milk has gone bad?', a: 'Sour or soapy smell can mean spoiled milk. Separating into cream and watery layers is normal. If you are unsure, throw it away.' },
      ],
      cta: 'Ava, the Telegram bot, can remind you when milk needs to be used and help with your pumping routine.',
      article: `## What this breast milk storage guide does

Pick the state of your milk and where you are keeping it. The guide tells you how long it is safe and, if you add a time, gives you a discard-by time. It also lists the rules for thawing, warming and refreezing.

The four states are freshly expressed, thawed from frozen, previously warmed, and leftover from a feed. The four places are room temperature, an insulated cooler with frozen ice packs, the fridge and the freezer.

## How the guide gets its times

Different organisations give slightly different figures. We looked at the CDC, the NHS (which follows NICE), La Leche League and the Academy of Breastfeeding Medicine, and use the shortest sensible time for each situation. The ranges are shown so you can see where the guidance differs.

## Storage times at a glance

| Milk | Room (25C or cooler) | Cooler with ice packs | Fridge | Freezer |
|---|---|---|---|---|
| Freshly expressed | 4 hours (up to 6 to 8 hours in some guidance) | Up to 24 hours | 4 days (up to 5 days NHS) | 6 months (up to 12 acceptable) |
| Thawed from frozen | About 2 hours | Treat as room temperature | 24 hours from fully thawed | Do not refreeze |
| Previously warmed | About 2 hours | About 2 hours | Do not store | Do not store |
| Leftover from a feed | 1 to 2 hours | 1 to 2 hours | Do not store | Do not store |

Fresh milk that sits at room temperature for longer than 4 hours is not automatically harmful, but bacteria multiply over time, and young babies are more vulnerable. This is why the cautious figure is used.

## Hot weather and power cuts

Many storage guides were written for cool homes. Rooms above 25C, a lack of air conditioning or an unreliable power supply change the picture. Warm rooms make milk spoil faster, so no guideline gives longer than the 4-hour figure at warm temperatures. If it is hot, we use a cautious 2 hours. That is our own precaution, not a published figure, so refrigerate or cool the milk as soon as you can.

If you have regular power cuts:

- Keep the fridge and freezer doors closed. The CDC says a full freezer stays frozen for about 48 hours and a half-full one for about 24. A fridge stays cold for about 4 hours.
- Use a cooler bag with frozen ice packs for expressed milk. It is safe for up to 24 hours as long as the ice packs stay frozen.
- Milk that still has ice crystals can go back in the freezer. Milk that has thawed but is still cold should go in the fridge and be used within a day, or thrown away.
- Express into clean, sealed containers, and fill smaller amounts to cut waste if you have to throw some away.

## Thawing, warming and refreezing

- Thaw in the fridge overnight, in a container of warm water, or under lukewarm running water.
- Do not use a microwave or the hob. They heat unevenly and can scald your baby's mouth.
- Warming is optional. Baby can drink milk cold or at room temperature.
- If you warm it, keep the container sealed in warm water for a few minutes and test a few drops on your wrist.
- Swirl to mix the fat. Do not shake hard.
- Never refreeze milk that has fully thawed.
- Use the oldest milk first.

Thawed milk has a clock that starts when it is fully thawed, not when it was expressed. This is the part people most often get wrong. A bag that was frozen 3 months ago is still counted as 24 hours once thawed in the fridge.

## Leftover milk and warmed milk

When a baby feeds from a bottle, saliva gets into the milk. After the feed ends, leftover milk should be used within 1 to 2 hours, and then thrown away. This is hard when milk is precious, so store it in small amounts (60 to 120 ml) and warm only what you need.

Milk that has been warmed but not offered can be used within about 2 hours. It should not be put back in the fridge or freezer.

## Containers and labelling

Use clean glass or hard food-grade plastic containers with tight lids, or breast milk bags made for freezing. Wash your hands before you express. Label each container with the date and time. Leave a little space at the top because milk expands when frozen. You can add chilled milk to a container of milk already in the fridge on the same day, once it has cooled to the same temperature.

## Travelling, work and childcare

If you pump at work or travel, chill the milk as soon as you can. A small insulated bag with frozen ice packs works well for the journey, and the milk can then go straight into a fridge or freezer when you arrive. Carry frozen milk in the cooler as well, so it stays frozen. If you are giving milk to a childminder or nursery, send it in clearly labelled, single-feed containers with the date and time, and ask them to follow the thawed and leftover rules above. Tell them to offer the oldest milk first.

## Nigeria and wherever you are

In warm climates, a flask or cooler with ice from a clean source can bridge a gap during power cuts, but ice melts quickly in a hot room, so check it often. If you do not have a fridge at all, express only what the baby is likely to take in one feed, offer it within the cautious time above and discard the rest. Washing your hands and equipment with clean water and soap matters more than any gadget. Never store milk in a container that has held anything other than food or drink.

## How accurate is the discard-by time?

The time is simply the start time you enter plus the storage limit. It assumes your fridge is at 4C or colder and your freezer is at -18C or colder, and that the milk was expressed with clean hands and equipment. If your fridge is warm or often opened, the real safe time is shorter. It does not apply to donor milk or milk for premature or sick babies. Hospitals and milk banks have their own stricter rules, so follow their advice.

## What is normal for stored milk

- Milk separates into a creamy layer and a thinner layer. Swirl to mix.
- Colour can be bluish, yellowish or slightly orange.
- Frozen milk can smell a little soapy or metallic due to fat breaking down. It is usually still safe, but if baby refuses it, you may try to use smaller batches that are used sooner.

## When to see a doctor or pharmacist

See a healthcare professional if your baby has diarrhoea, vomiting, a fever or is unusually sleepy or not feeding well after a feed from stored milk. Call a lactation consultant, midwife or health visitor if you are worried about your supply, pumping, or storage. This guide is general information, not medical advice, and does not replace advice for your baby's own situation.`,
    },
  },
};
