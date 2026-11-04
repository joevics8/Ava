import type { Lang } from '@/lib/site';

export interface UiStrings {
  tools: string; blog: string; dashboard: string; openTelegram: string; startOnTelegram: string;
  home: string; allTools: string; relatedTools: string; faq: string; readMore: string; minRead: string;
  latestPosts: string; noPosts: string; notMedical: string; privacyNote: string; footerTag: string;
  privacy: string; terms: string; languages: string;
  chatShort: string; explore: string; legal: string; skip: string; mainNav: string;
  onThisPage: string; relatedArticles: string; publishedOn: string; updatedOn: string; breadcrumb: string;
  toolsTitle: string; toolsDesc: string; toolsH1: string; toolsIntro: string;
  blogTitle: string; blogDesc: string; blogH1: string; blogIntro: string; homeCta: string;
  lastPeriod: string; cycleLength: string; periodLength: string; days: string; calculate: string; invalidDate: string;
  invalidCycle: string; nextPeriods: string; likelyWindow: string; mostLikely: string; ovulationDay: string; fertileWindow: string;
  testFrom: string; dueDate: string; pregnantNow: string; weeks: string; trimesterStarts: string; secondTri: string; thirdTri: string; lmp: string;
  cookieText: string; accept: string; decline: string;
}

export const UI: Partial<Record<Lang, UiStrings>> & { en: UiStrings } = {
  en: {
    tools: 'Tools', blog: 'Blog', dashboard: 'Dashboard', openTelegram: 'Open Ava on Telegram', startOnTelegram: 'Chat with Ava on Telegram',
    home: 'Home', allTools: 'All tools', relatedTools: 'More free tools', faq: 'Frequently asked questions', readMore: 'Read more', minRead: 'min read',
    latestPosts: 'Latest articles', noPosts: 'Articles are on the way.', notMedical: 'Ava shares general wellness information, not medical advice. See a clinician for medical concerns.',
    privacyNote: 'Private: calculated in your browser, nothing is saved.', footerTag: 'Your cycle and body, explained.', privacy: 'Privacy', terms: 'Terms', languages: 'Languages',
    chatShort: 'Chat on Telegram', explore: 'Explore', legal: 'Legal', skip: 'Skip to content', mainNav: 'Main navigation',
    onThisPage: 'In this article', relatedArticles: 'Keep reading', publishedOn: 'Published', updatedOn: 'Updated', breadcrumb: 'Breadcrumb',
    toolsTitle: 'Free Cycle Calculators: Period, Ovulation & Due Date',
    toolsDesc: 'Free, private calculators for your cycle: predict your next period, find your fertile window and estimate your due date. No sign-up, nothing saved.',
    toolsH1: 'Free cycle and pregnancy calculators',
    toolsIntro: 'Work out when your next period is due, when you are most fertile and when your baby is expected. Every calculator runs in your browser, so the dates you enter are never saved or sent anywhere.',
    blogTitle: 'Cycle & Body Guides: Periods, Ovulation, Health',
    blogDesc: 'Clear, practical guides on periods, ovulation, symptoms and everyday health. General wellness information in plain language, not medical advice.',
    blogH1: 'Guides to your cycle and body',
    blogIntro: 'Practical reading on periods, ovulation, symptoms and wellbeing. General wellness information in plain language, not medical advice.',
    homeCta: 'Ready to understand your cycle? Say hello to Ava.',
    lastPeriod: 'First day of your last period', cycleLength: 'Average cycle length', periodLength: 'Period length', days: 'days', calculate: 'Calculate',
    invalidDate: 'Please enter a valid date.', invalidCycle: 'Cycle length should be between 21 and 45 days.', nextPeriods: 'Your next periods', likelyWindow: 'Likely window',
    mostLikely: 'Most likely', ovulationDay: 'Estimated ovulation day', fertileWindow: 'Fertile window', testFrom: 'Pregnancy test reliable from', dueDate: 'Estimated due date',
    pregnantNow: 'You are about', weeks: 'weeks', trimesterStarts: 'Trimesters', secondTri: 'Second trimester starts', thirdTri: 'Third trimester starts', lmp: 'First day of your last period',
    cookieText: 'We use cookies for ads and to measure traffic. You can accept or decline non-essential cookies.', accept: 'Accept', decline: 'Decline',
  },
  es: {
    tools: 'Herramientas', blog: 'Blog', dashboard: 'Panel', openTelegram: 'Abrir Ava en Telegram', startOnTelegram: 'Habla con Ava en Telegram',
    home: 'Inicio', allTools: 'Todas las herramientas', relatedTools: 'Más herramientas gratis', faq: 'Preguntas frecuentes', readMore: 'Leer más', minRead: 'min de lectura',
    latestPosts: 'Últimos artículos', noPosts: 'Pronto habrá artículos.', notMedical: 'Ava ofrece información general de bienestar, no consejo médico. Consulta con un profesional ante cualquier duda médica.',
    privacyNote: 'Privado: se calcula en tu navegador, no se guarda nada.', footerTag: 'Tu ciclo y tu cuerpo, explicados.', privacy: 'Privacidad', terms: 'Términos', languages: 'Idiomas',
    chatShort: 'Chatea en Telegram', explore: 'Explorar', legal: 'Legal', skip: 'Ir al contenido', mainNav: 'Navegación principal',
    onThisPage: 'En este artículo', relatedArticles: 'Sigue leyendo', publishedOn: 'Publicado', updatedOn: 'Actualizado', breadcrumb: 'Ruta de navegación',
    toolsTitle: 'Calculadoras Gratis: Periodo, Ovulación y Parto',
    toolsDesc: 'Calculadoras gratuitas y privadas: predice tu próxima regla, encuentra tu ventana fértil y calcula tu fecha de parto. Sin registro ni datos guardados.',
    toolsH1: 'Calculadoras gratuitas de ciclo y embarazo',
    toolsIntro: 'Descubre cuándo te toca la próxima regla, cuándo eres más fértil y cuándo se espera a tu bebé. Todas las calculadoras funcionan en tu navegador, así que las fechas que escribes no se guardan ni se envían.',
    blogTitle: 'Guías de Ciclo y Cuerpo: Regla, Ovulación, Salud',
    blogDesc: 'Guías claras sobre la regla, la ovulación, los síntomas y la salud diaria, escritas para que puedas actuar. Información general, no consejo médico.',
    blogH1: 'Guías sobre tu ciclo y tu cuerpo',
    blogIntro: 'Lecturas prácticas sobre la regla, la ovulación, los síntomas y el bienestar. Información general de bienestar en lenguaje sencillo, no consejo médico.',
    homeCta: '¿Lista para entender tu ciclo? Saluda a Ava.',
    lastPeriod: 'Primer día de tu última regla', cycleLength: 'Duración media del ciclo', periodLength: 'Duración de la regla', days: 'días', calculate: 'Calcular',
    invalidDate: 'Introduce una fecha válida.', invalidCycle: 'La duración del ciclo debe estar entre 21 y 45 días.', nextPeriods: 'Tus próximas reglas', likelyWindow: 'Ventana probable',
    mostLikely: 'Fecha más probable', ovulationDay: 'Día estimado de ovulación', fertileWindow: 'Ventana fértil', testFrom: 'Prueba de embarazo fiable desde', dueDate: 'Fecha probable de parto',
    pregnantNow: 'Estás de aproximadamente', weeks: 'semanas', trimesterStarts: 'Trimestres', secondTri: 'El segundo trimestre empieza', thirdTri: 'El tercer trimestre empieza', lmp: 'Primer día de tu última regla',
    cookieText: 'Usamos cookies para anuncios y para medir el tráfico. Puedes aceptar o rechazar las cookies no esenciales.', accept: 'Aceptar', decline: 'Rechazar',
  },
};

export const ui = (lang: Lang): UiStrings => UI[lang] ?? UI.en;
