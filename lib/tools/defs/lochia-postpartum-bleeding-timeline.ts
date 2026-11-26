import type { Tool } from '../types';

export const tool: Tool = {
  id: 'lochia-postpartum-bleeding-timeline',
  category: 'pregnancy',
  related: ['period-return-timeline', 'lam-postpartum-fertility', 'pregnancy-weeks-to-months'],
  text: {
    en: {
      slug: 'lochia-postpartum-bleeding-timeline',
      title: 'Lochia Timeline: Bleeding After Birth by Day',
      h1: 'Lochia Timeline: How Long Does Bleeding After Birth Last?',
      description: 'Enter your delivery date to see which stage of postpartum bleeding (lochia) you are likely in, what is normal, and the warning signs that need urgent care.',
      intro: 'Enter your baby\'s birth date and type of birth to see where you are in the lochia timeline, with date windows for each stage. You can also tick any warning signs you have noticed.',
      faqs: [
        { q: 'How long does postpartum bleeding last?', a: 'Lochia usually lasts up to about 6 weeks after birth, and some people have light traces until 8 weeks. It should get lighter and change colour over that time. Bleeding that stays heavy or bright red needs checking.' },
        { q: 'What are the stages of lochia?', a: 'Lochia rubra is red and heaviest in roughly the first 3 to 4 days. Lochia serosa is pink to brown from about day 4 to day 12. Lochia alba is yellowish white and can continue to about 6 weeks.' },
        { q: 'Is bleeding after a C-section different?', a: 'You still bleed from the womb after a caesarean, usually following the same pattern and length. Some people notice it is lighter. Use maternity pads rather than tampons or a cup.' },
        { q: 'When is postpartum bleeding an emergency?', a: 'Get urgent care if you soak a pad every hour, feel dizzy or faint, have a racing heartbeat, or have a fever with a sore tummy. These can be signs of haemorrhage or infection.' },
        { q: 'What size clots are normal after birth?', a: 'Small clots, smaller than a 50p coin or a quarter, can be normal early on. Clots bigger than a golf ball, or lots of clots, should be checked the same day by your midwife or doctor.' },
        { q: 'Why did my bleeding get heavier again?', a: 'A short increase after a lot of activity, or during breastfeeding, can happen as the womb contracts. If bleeding turns bright red again after easing, gets steadily heavier, or smells bad, call your midwife or doctor the same day.' },
        { q: 'Can I use tampons or a menstrual cup after birth?', a: 'It is advised to use maternity pads, not tampons or cups, until your postnatal check at around 6 to 8 weeks. The womb and cervix are healing and there is a higher infection risk.' },
        { q: 'Is lochia the same as my period returning?', a: 'No. Lochia is the womb lining and blood from where the placenta was attached. A true period can return from about 6 weeks if you are not breastfeeding, or much later if you are.' },
      ],
      cta: 'Ava, the Telegram bot, can help you track your recovery and remind you when to check in with your midwife.',
      article: `## What this lochia timeline does

Lochia is the vaginal bleeding and discharge you have after giving birth. It is blood, womb lining and mucus from where the placenta was attached, and it happens whether you had a vaginal birth or a caesarean.

Enter the date of birth and the type of birth. The tool shows the day you are on, which stage of postpartum bleeding is most likely now, and the date window for each stage. You can also tick any warning signs. If any need urgent care, the page will say so clearly.

## The stages of lochia: rubra, serosa and alba

Bleeding after birth usually moves through three stages. The days below count from the day of birth.

| Stage | Typical days | Colour | Flow |
|---|---|---|---|
| Lochia rubra | Day 0 to about 3 or 4 | Dark or bright red | Heaviest, like a heavy period |
| Lochia serosa | About day 4 to 12 | Pink to brown | Lighter and thinner |
| Lochia alba | About day 12 to 6 weeks | Yellowish white or cream | Light discharge or spotting |

These are typical windows from sources such as Cleveland Clinic and the NHS. The stages blend into each other, so you may see a mix of colours for a few days. The tool uses the middle of the usual ranges and does not know your own body.

## How long does postpartum bleeding last?

Most people stop bleeding at around 6 weeks, and some have light traces for up to 8 weeks. The red blood usually fades within the first 1 to 2 weeks. Most health services say it should be gone by about 12 weeks at the latest, though bleeding that goes on past 8 weeks is worth mentioning to your doctor.

Bleeding rarely falls in a straight line. It is normal to have a gush when you stand up after resting, after a feed, or after a lot of activity. Breastfeeding makes the womb contract, which can bring a little extra red blood for a short time. If it settles when you rest, that is usually fine.

## Bleeding after a C-section

Bleeding after a caesarean usually follows the same pattern and length as after a vaginal birth. Some people find it a little lighter, and others find it just as heavy, so do not worry if yours is different from a friend's. You may also have pain or tenderness around the wound, which is separate from the bleeding. Check the wound for redness, swelling or discharge too, and report anything unusual.

## What is normal in the first weeks

- Bleeding heaviest in the first days, needing a thick pad every few hours.
- Small clots early on, smaller than a 50p coin.
- Period-like cramps (afterpains) as the womb shrinks, especially while breastfeeding.
- A mild, earthy or musty smell, similar to a period.
- Colour changing from red to pink to brown to cream.
- Spotting that comes and goes in the later weeks.

Use very absorbent maternity pads. Avoid tampons and menstrual cups until your postnatal check, because of infection risk. Wash your hands before and after changing pads and rest as much as you can. Heavy lifting and long periods on your feet can make bleeding heavier.

## Warning signs: when to get help

Heavy bleeding after birth, called postpartum haemorrhage, can happen in the first 24 hours and also later, up to 12 weeks. Later bleeding is often due to infection or a small piece of placenta left behind, and it is treatable when seen quickly.

Get urgent care now (call your maternity unit, an ambulance or go to the emergency department) if you have:

- Soaking a pad every hour.
- Feeling dizzy, faint or weak, or a racing heartbeat.
- Fever, chills or feeling flu-like, especially with a sore tummy.
- Sudden, heavy blood loss.

Call your midwife or doctor the same day if you have:

- Clots bigger than a golf ball, or lots of clots.
- Foul-smelling discharge, or a green colour.
- Bleeding that turns bright red again after it had faded, or that gets heavier instead of lighter.
- Red bleeding continuing beyond about a week.
- Increasing pain in your tummy, vagina or around a wound.
- Bleeding that stops completely and then starts again.

If you are not sure, ask. Midwives and doctors would always rather check than have you wait at home.

## Looking after yourself while you bleed

Rest when the baby rests, drink enough water and eat regular meals, including iron-rich foods such as beans, eggs, leafy greens and meat or fish. Ask for help with lifting and housework in the first weeks. Sex and exercise can wait until the bleeding has eased and you feel ready, and many doctors advise waiting until after the postnatal check. Gentle walking is usually fine.

## How accurate is this timeline?

The tool counts days from the date you enter and applies standard ranges. It is as accurate as those ranges, which describe most people and not everyone. It cannot see how much you are bleeding or tell whether something is wrong. After a long labour, twins, a big baby, a haemorrhage or an assisted delivery, your recovery may take longer.

The timeline is a guide to what is typical, not a diagnosis. What you feel and see matters more than the date. If something worries you, trust it and ask for help, even if the tool says you are in a normal window.

## What to track

If you are unsure what is normal for you, write down a few details each day:

- How many pads you use and how full they are.
- The colour and any clots, with a rough size.
- Any smell, fever, pain or dizziness.

This helps a midwife or doctor decide what is going on if you call.

## Lochia and your period returning

Lochia is not a period. It comes from the healing womb. A real period can return from around 6 weeks if you are not breastfeeding, and often much later if you are. Light bleeding after the first few weeks can be hard to tell apart from either. If you see fresh red bleeding after you thought lochia had finished, it is worth asking your midwife or doctor, particularly in the first 8 weeks. The period return timeline tool on this site explains what to expect.

## Nigeria and wherever you are

If you gave birth at home or in a clinic far from a hospital, keep the emergency number and the route to the nearest facility with blood available somewhere easy to find. Have someone with you in the first days who can call for help if you feel faint. Do not wait for the postnatal visit if you have any urgent signs above. If you have anaemia or low iron, ask about iron supplements and iron-rich foods, because blood loss can leave you more tired and breathless than you expect.

## When to see a doctor

Go to your postnatal check at the time you are given, usually 6 to 8 weeks after birth, and mention your bleeding. Go sooner if bleeding is still heavy at 2 weeks, if you are still bleeding at 8 weeks, or if you feel unwell in any way. This page is general information and not medical advice.`,
    },
  },
};
