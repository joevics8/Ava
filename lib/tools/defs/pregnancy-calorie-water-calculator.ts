import type { Tool } from '../types';

export const tool: Tool = {
  id: 'pregnancy-calorie-water-calculator',
  category: 'pregnancy',
  related: ['due-date-calculator', 'pregnancy-weeks-to-months', 'blood-group-rh-pregnancy'],
  text: {
    en: {
      slug: 'pregnancy-calorie-water-calculator',
      title: 'Pregnancy Calories and Water Calculator',
      h1: 'Pregnancy Calorie and Water Calculator',
      description: 'How many extra calories and how much water do you need in pregnancy? Get your trimester, daily fluids, key nutrients, foods to avoid and food ideas.',
      intro: 'Enter your week of pregnancy to see how many extra calories you may need, how much to drink, which nutrients matter and which foods to avoid. It also shows what the extra calories can look like in everyday foods, including Nigerian and African staples.',
      faqs: [
        { q: 'How many extra calories do I need when pregnant?', a: 'None in the first trimester. US guidance adds about 340 calories a day in the second trimester and about 450 in the third. UK advice is lower, around 200 in the last trimester only. These are averages, so treat them as upper limits rather than targets.' },
        { q: 'Am I really eating for two?', a: 'No. The extra energy is about one small snack or a modest extra portion, not a second full meal. Quality matters more than quantity, so build meals around beans, eggs, fish, vegetables and a starchy food.' },
        { q: 'How much water should I drink when pregnant?', a: 'Aim for roughly 1.6 to 2.3 litres of drinks a day, which is about 6 to 9 cups of 250 ml. Total water including food is about 2.3 litres by European guidance and 3 litres by US guidance. Drink more in hot weather, when you are active or if you are vomiting.' },
        { q: 'Do tea, coffee and other drinks count towards my fluids?', a: 'Yes, all drinks count, but water is best. Keep caffeine to 200 mg a day, about two mugs of instant coffee, and limit sugary drinks and juice.' },
        { q: 'Which vitamins do I need in pregnancy?', a: 'Folic acid, 400 micrograms a day from before conception until 12 weeks, and vitamin D, 10 micrograms a day in UK advice. Iron and iodine needs also rise. Your midwife or doctor will advise which supplements suit you and which doses to use.' },
        { q: 'What foods should I avoid when pregnant?', a: 'Avoid alcohol, raw or undercooked meat, fish and eggs, unpasteurised milk and soft cheese, liver, shark, swordfish and marlin. Also limit tuna, oily fish and caffeine. Check with your midwife before using herbal mixtures.' },
        { q: 'How many extra calories do I need with twins?', a: 'Needs are higher with twins, but guidelines do not give a standard figure. Ask your midwife, doctor or a dietitian for a plan, because it depends on your size and health.' },
        { q: 'What if I have no appetite or I am vomiting?', a: 'Small, frequent, plain meals and sips of fluid often help. If you cannot keep food or drink down, or you are losing weight, see your midwife or doctor, as treatment is available.' },
      ],
      cta: 'Ava, the Telegram bot, can help you with pregnancy meal ideas and reminders to drink water.',
      article: `## What this pregnancy calorie and water calculator does

This tool shows what changes in your daily needs once you are pregnant. Enter your week of pregnancy and whether you are expecting one baby or twins. You see how many extra calories are generally advised for your trimester, how much to drink, the nutrients that matter most, the foods to avoid and what the extra energy looks like on your plate.

It is general information for a healthy pregnancy. It is not a meal plan, and it does not replace advice from your midwife, doctor or a dietitian.

## How many extra calories do you need in pregnancy?

The figures most often quoted come from US energy requirements, used by ACOG and the Academy of Nutrition and Dietetics:

- **First trimester (to week 13):** no extra calories.
- **Second trimester (weeks 14 to 27):** about 340 extra calories a day.
- **Third trimester (week 28 onwards):** about 450 extra calories a day.

UK advice is more cautious. It suggests no extra calories until the last trimester, and then only about 200 a day. Because sources differ, the tool shows a range, and the US number is best treated as a ceiling. Your own need depends on your weight, how active you are and how you feel.

## What do the extra calories look like?

Not much. About 340 calories is roughly an extra snack or a modest extra portion at a meal, not a second dinner. The tool gives ideas by food group rather than exact counts, because the energy in home cooking depends on portion size, oil and recipe.

- **Starchy foods:** brown or parboiled rice, wholegrain bread, boiled yam, sweet potato or plantain, oats, pap (ogi), millet or maize.
- **Protein foods:** eggs, beans (including moi moi and akara), fish, chicken, groundnuts and groundnut butter.
- **Fruit and vegetables:** pawpaw, banana, orange, mango, avocado, and leafy greens such as ugu, efo or spinach.
- **Dairy and healthy fats:** plain pasteurised yoghurt or milk, a little vegetable oil in cooking, avocado.

A simple second trimester example is a boiled egg with bread and a piece of fruit. In the third trimester, it might be that snack plus an extra scoop of beans at dinner. Fried snacks, sugary drinks and sweets fill you up without giving you much else, so choose them less often.

## How much water should you drink when pregnant?

Your blood volume rises and you need more fluid for the baby and amniotic fluid. Different bodies give slightly different figures:

- NHS-style advice is 6 to 8 glasses, about 1.6 litres, of fluid a day.
- The European Food Safety Authority sets total water at 2.3 litres a day in pregnancy (including food).
- The US Institute of Medicine suggests about 3 litres of total water a day, with roughly 2.3 litres from drinks.

The tool gives about 1.6 to 2.3 litres of drinks a day, which is roughly 6 to 9 cups of 250 ml. In hot weather, when you are active or when you have been vomiting, you will need more. Water is best, but milk, soups, tea and diluted juice count. A simple check is the colour of your urine: pale yellow is a good sign, and dark yellow means drink more.

## Key nutrients in pregnancy

- **Folic acid:** 400 micrograms a day from before conception until 12 weeks lowers the risk of neural tube defects. A higher prescription dose is used if you have diabetes, take epilepsy medicine, have a BMI of 30 or more or have had an affected pregnancy.
- **Vitamin D:** 10 micrograms a day is advised in the UK. Do not take more than 100 micrograms a day. Darker skin and covering clothing lower your own production.
- **Iron:** needs rise as your blood volume grows. WHO advises daily iron with folic acid in antenatal care, but only take the dose you are given. Pair iron-rich foods such as beans, fish, meat and dark leaves with a vitamin C food, and avoid tea and coffee at the same meal.
- **Iodine:** needed for your baby's brain development. Use iodised salt, and eat fish, eggs and dairy.
- **Protein:** about 1.1 g per kg of body weight a day in the second half of pregnancy by US guidance. Most women eating a mixed diet reach this.

Ask your midwife or doctor before taking any other supplement, because too much of some, such as vitamin A, can harm the baby.

## Foods and drinks to avoid in pregnancy

- Alcohol: no safe amount is known.
- Raw or undercooked meat, poultry, fish, shellfish and eggs.
- Unpasteurised milk and fresh cheeses, including any traditional dairy that has not been boiled or pasteurised.
- Liver and liver products, and vitamin A (retinol) or cod liver oil supplements.
- Shark, swordfish and marlin. Limit tuna, and keep oily fish to 2 portions a week.
- More than 200 mg of caffeine a day.
- Herbal mixtures or tonics that have not been checked by your clinician, and herbal teas containing liquorice root.
- Salads, fruit and vegetables that have not been washed, and cooked foods that have been left out at room temperature.

## How accurate is it?

The numbers are averages for healthy women with one baby. They do not know your height, weight, activity level, health conditions or how you are feeling. Guidelines also differ between countries, which is why a range is shown.

Weight gain is a more useful check than counting calories. If you are gaining much faster or slower than usual, our pregnancy weight gain calculator can help you see where you are, and your midwife can look at it with you.

## What is normal?

It is normal to be hungrier in the second and third trimesters, to go off some foods early on, to feel full quickly late in pregnancy and to have heartburn. Eating small, regular meals often helps. It is also normal to crave certain foods. Cravings for non-food items such as chalk, clay or ice, which can mean low iron, are worth mentioning to your midwife.

## When to see a doctor or midwife

Talk to your midwife or doctor if you:

- cannot keep food or fluids down, or are losing weight
- have dark urine, dizziness or very little urine
- have severe or constant thirst
- have diabetes, anaemia, a very high or low BMI or any condition that affects eating
- are expecting twins and want a plan for eating

## Nigeria and wherever you are

Everyday Nigerian and African foods meet pregnancy needs well. Beans, eggs, fish, groundnuts, leafy greens, pawpaw, yam and millet are affordable and nourishing. Boil unpasteurised milk or fresh milk products before use. Cook meat, fish and bush meat until well done. Wash vegetables in clean water. Ask your clinic about iron, folic acid and malaria prevention, as they are all offered in antenatal care. Choose an iodised salt where you can find it.`,
    },
  },
};
