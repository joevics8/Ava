import { ENABLED_LANGS, Lang, toolPath } from '@/lib/site';

// One entry per tool. Copy lives here (data), pages are generic — adding a
// tool or a language is a data change, not a new page file. Translations must
// be written natively per language (not machine-pasted) before the language is
// added to ENABLED_LANGS.

export type ToolId = 'period-calculator' | 'ovulation-calculator' | 'due-date-calculator';

export interface ToolText {
  slug: string;          // ASCII, translated per language
  title: string;         // <title>, ≤ 60 chars
  h1: string;
  description: string;   // meta description, ≤ 155 chars
  intro: string;
  faqs: { q: string; a: string }[];
  /** Short line shown above the Telegram button after the result. */
  cta: string;
}

export interface Tool {
  id: ToolId;
  related: ToolId[];
  text: Partial<Record<Lang, ToolText>>;
}

export const TOOLS: Tool[] = [
  {
    id: 'period-calculator',
    related: ['ovulation-calculator', 'due-date-calculator'],
    text: {
      en: {
        slug: 'period-calculator',
        title: 'Period Calculator: Predict Your Next 3 Periods',
        h1: 'Period Calculator',
        description: 'Enter your last period date and cycle length to see when your next 3 periods are likely to start. Free, private, no sign-up.',
        intro: 'Add the first day of your last period and your usual cycle length. You get your next three expected periods, each with a normal window of two days either side.',
        faqs: [
          { q: 'How is the next period date calculated?', a: 'We add your cycle length to the first day of your last period. The window is two days either side because cycles naturally vary by a few days.' },
          { q: 'What counts as a normal cycle length?', a: 'Most adult cycles fall between 21 and 35 days. A cycle that varies by a few days from month to month is common.' },
          { q: 'Is my data stored?', a: 'No. The calculation happens in your browser. Nothing you enter is saved or sent anywhere.' },
          { q: 'When is a period considered late?', a: 'Usually when it is more than a couple of days past your most likely date. Stress, illness, travel and sleep can all shift it. If you could be pregnant, a test is reliable from the first day of a missed period.' },
        ],
        cta: 'Want Ava to learn your real cycle and remind you before it starts?',
      },
      es: {
        slug: 'calculadora-de-periodo',
        title: 'Calculadora de Periodo: Predice tus Próximas 3 Reglas',
        h1: 'Calculadora de Periodo',
        description: 'Introduce la fecha de tu última regla y la duración de tu ciclo para ver cuándo vendrán tus próximas 3 reglas. Gratis, privada y sin registro.',
        intro: 'Indica el primer día de tu última regla y la duración habitual de tu ciclo. Verás tus próximas tres reglas previstas, cada una con una ventana normal de dos días antes y después.',
        faqs: [
          { q: '¿Cómo se calcula la fecha de la próxima regla?', a: 'Sumamos la duración de tu ciclo al primer día de tu última regla. La ventana es de dos días antes y después porque los ciclos varían de forma natural.' },
          { q: '¿Qué duración de ciclo es normal?', a: 'La mayoría de los ciclos adultos duran entre 21 y 35 días. Es habitual que varíe unos días de un mes a otro.' },
          { q: '¿Se guardan mis datos?', a: 'No. El cálculo se hace en tu navegador. Nada de lo que escribes se guarda ni se envía.' },
          { q: '¿Cuándo se considera que la regla se retrasa?', a: 'Normalmente cuando pasan más de un par de días de tu fecha más probable. El estrés, la enfermedad, los viajes o el sueño pueden desplazarla. Si podrías estar embarazada, una prueba es fiable desde el primer día de retraso.' },
        ],
        cta: '¿Quieres que Ava aprenda tu ciclo real y te avise antes de que empiece?',
      },
    },
  },
  {
    id: 'ovulation-calculator',
    related: ['period-calculator', 'due-date-calculator'],
    text: {
      en: {
        slug: 'ovulation-calculator',
        title: 'Ovulation Calculator: Find Your Fertile Window',
        h1: 'Ovulation Calculator',
        description: 'Estimate your ovulation day and 7-day fertile window from your last period and cycle length. Free, private and based on standard medical guidance.',
        intro: 'Ovulation usually happens about 14 days before your next period. Your fertile window is the five days before ovulation, ovulation day, and the day after.',
        faqs: [
          { q: 'How accurate is an ovulation calculator?', a: 'It is an estimate from calendar maths. Ovulation can shift with stress, illness or irregular cycles, so treat the dates as a guide, not a measurement.' },
          { q: 'Why is the fertile window longer than one day?', a: 'Sperm can survive for up to five days, and an egg survives about a day, so pregnancy is possible from roughly five days before ovulation until the day after.' },
          { q: 'Can I use this to avoid pregnancy?', a: 'Calendar estimates alone are not a reliable method of contraception. Talk to a clinician about methods that suit you.' },
          { q: 'When can I take a pregnancy test?', a: 'A home test is reliable from the first day of a missed period. If it is negative and your period is still late, retest in 3 to 7 days.' },
        ],
        cta: 'Want Ava to track this for you and message you when your window opens?',
      },
      es: {
        slug: 'calculadora-de-ovulacion',
        title: 'Calculadora de Ovulación: Encuentra tus Días Fértiles',
        h1: 'Calculadora de Ovulación',
        description: 'Calcula tu día de ovulación y tu ventana fértil de 7 días a partir de tu última regla y la duración del ciclo. Gratis, privada y sin registro.',
        intro: 'La ovulación suele producirse unos 14 días antes de tu próxima regla. Tu ventana fértil son los cinco días anteriores a la ovulación, el día de la ovulación y el día siguiente.',
        faqs: [
          { q: '¿Qué tan precisa es una calculadora de ovulación?', a: 'Es una estimación basada en el calendario. La ovulación puede cambiar con el estrés, la enfermedad o los ciclos irregulares, así que úsala como guía, no como medición.' },
          { q: '¿Por qué la ventana fértil dura más de un día?', a: 'Los espermatozoides pueden sobrevivir hasta cinco días y el óvulo cerca de un día, por eso el embarazo es posible desde unos cinco días antes de la ovulación hasta el día siguiente.' },
          { q: '¿Puedo usarla para evitar el embarazo?', a: 'Las estimaciones de calendario por sí solas no son un método anticonceptivo fiable. Consulta con un profesional qué método te conviene.' },
          { q: '¿Cuándo puedo hacerme una prueba de embarazo?', a: 'Una prueba casera es fiable desde el primer día de retraso. Si sale negativa y la regla sigue sin llegar, repítela a los 3 a 7 días.' },
        ],
        cta: '¿Quieres que Ava lo siga por ti y te escriba cuando empiece tu ventana?',
      },
    },
  },
  {
    id: 'due-date-calculator',
    related: ['ovulation-calculator', 'period-calculator'],
    text: {
      en: {
        slug: 'due-date-calculator',
        title: 'Due Date Calculator: Estimate Your Baby’s Due Date',
        h1: 'Due Date Calculator',
        description: 'Enter the first day of your last period to estimate your due date, how many weeks pregnant you are, and when each trimester starts.',
        intro: 'This uses the standard method: your due date is 280 days (40 weeks) after the first day of your last period.',
        faqs: [
          { q: 'How is the due date calculated?', a: 'We add 280 days to the first day of your last menstrual period (Naegele’s rule). It assumes a 28-day cycle with ovulation around day 14.' },
          { q: 'How many babies are born on their due date?', a: 'Only a small share. Most babies arrive within a couple of weeks either side of the estimate, and a scan can refine it.' },
          { q: 'What if my cycles are not 28 days?', a: 'Then the estimate may be off by days. An early ultrasound is the most accurate way to date a pregnancy.' },
          { q: 'Does this replace medical care?', a: 'No. It is an estimate for planning. See a midwife or doctor for confirmation and care.' },
        ],
        cta: 'Ava can answer pregnancy questions any time and keep your dates in one place.',
      },
      es: {
        slug: 'calculadora-fecha-de-parto',
        title: 'Calculadora de Fecha de Parto: Cuándo Nace tu Bebé',
        h1: 'Calculadora de Fecha de Parto',
        description: 'Introduce el primer día de tu última regla para estimar tu fecha probable de parto, tus semanas de embarazo y cuándo empieza cada trimestre.',
        intro: 'Usa el método estándar: tu fecha probable de parto es 280 días (40 semanas) después del primer día de tu última regla.',
        faqs: [
          { q: '¿Cómo se calcula la fecha de parto?', a: 'Sumamos 280 días al primer día de tu última menstruación (regla de Naegele). Supone un ciclo de 28 días con ovulación hacia el día 14.' },
          { q: '¿Cuántos bebés nacen en la fecha prevista?', a: 'Solo una pequeña parte. La mayoría llega en un margen de un par de semanas y una ecografía puede afinar la fecha.' },
          { q: '¿Y si mis ciclos no son de 28 días?', a: 'Entonces la estimación puede variar unos días. Una ecografía temprana es la forma más precisa de datar el embarazo.' },
          { q: '¿Sustituye a la atención médica?', a: 'No. Es una estimación para planificar. Consulta con una matrona o médico para confirmarla y recibir atención.' },
        ],
        cta: 'Ava resuelve tus dudas sobre el embarazo en cualquier momento y guarda tus fechas.',
      },
    },
  },
];

export const toolById = (id: ToolId) => TOOLS.find(t => t.id === id)!;

export function findTool(lang: Lang, slug: string): { tool: Tool; text: ToolText } | null {
  for (const tool of TOOLS) {
    const text = tool.text[lang];
    if (text && text.slug === slug) return { tool, text };
  }
  return null;
}

/** Tools that actually exist in a language (and the language is enabled). */
export function toolsFor(lang: Lang): { tool: Tool; text: ToolText }[] {
  if (!ENABLED_LANGS.includes(lang)) return [];
  return TOOLS.flatMap(tool => (tool.text[lang] ? [{ tool, text: tool.text[lang]! }] : []));
}

/** hreflang group: every enabled language this tool exists in → its path. */
export function toolAlternates(tool: Tool): Partial<Record<Lang, string>> {
  const out: Partial<Record<Lang, string>> = {};
  for (const lang of ENABLED_LANGS) {
    const t = tool.text[lang];
    if (t) out[lang] = toolPath(lang, t.slug);
  }
  return out;
}
