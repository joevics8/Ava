// Mental-health safety. When she writes about wanting to die or hurting herself, Ava answers with care and
// a way to reach a person. She does not offer remedies, meditations, foods or tracking in that reply.

const HIGH = [
  /\b(kill|killing|hurt|harm|cut|cutting|end)\s+(myself|my own life|my life)\b/,
  /\bsuicid(e|al)\b/,
  /\b(want|wanna|wish|ready|going|plan(ning)?)\s*(to|2)?\s*(die|be dead|disappear forever)\b/,
  /\b(don'?t|do not|no longer|not)\s+(want|wanna)\s+to\s+(live|be here|be alive|exist|wake up)\b/,
  /\b(take|taking)\s+my\s+own\s+life\b/,
  /\bself[- ]?harm(ing)?\b/,
  /\b(better|best)\s+off\s+(dead|without me|if i (was|were) gone)\b/,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|go(ing)? on|being alive)\b/,
  /\b(can'?t|cannot|can not)\s+(go on|do this anymore|take it anymore|carry on)\b/,
  /\b(life|living)\s+(is|feels)\s+(pointless|not worth|worthless)\b/,
  /\bhopeless\b[^.!?]*\b(life|everything|future)\b|\b(life|everything|future)\b[^.!?]*\bhopeless\b/,
];

// She is telling us she is NOT in that place, or is quoting something.
const NEGATED = /\b(not|never|n'?t)\s+(feeling\s+)?(suicidal|going to (kill|hurt)\s+myself|want(ing)? to (die|hurt myself))\b|\bi('?m| am) not (suicidal|thinking of (suicide|killing myself|hurting myself))\b|\bno (thoughts|urge)s? of (suicide|self[- ]?harm|hurting myself)\b/;

export function detectCrisis(text: string): boolean {
  const t = text.toLowerCase().replace(/[’‘]/g, "'");
  if (NEGATED.test(t)) return false;
  return HIGH.some(re => re.test(t));
}

/** Lines that are accurate and widely published; anywhere else points to the directory of helplines. */
function lineFor(country: string | null | undefined): string {
  const c = (country || '').toLowerCase();
  if (/united states|usa|^us$|america/.test(c)) return 'In the US you can call or text 988 (Suicide & Crisis Lifeline) any time.';
  if (/united kingdom|^uk$|england|scotland|wales|ireland/.test(c)) return 'In the UK and Ireland you can call Samaritans free on 116 123 any time.';
  if (/australia/.test(c)) return 'In Australia you can call Lifeline on 13 11 14 any time.';
  if (/nigeria/.test(c)) return 'In Nigeria, if you are in immediate danger call 112, and findahelpline.com lists free, confidential lines you can reach.';
  return 'If you are in immediate danger, please call your local emergency number. findahelpline.com lists free, confidential helplines for almost every country.';
}

export function crisisReply(name: string | null | undefined, country?: string | null): string {
  const who = name ? `${name}, ` : '';
  return (
    `${who}I'm really glad you told me, and I'm taking it seriously. What you're feeling sounds heavy, and you don't have to carry it alone 💗\n\n` +
    `Please reach out to a real person right now: someone you trust, who can sit with you or stay on the phone. ` +
    `${lineFor(country)}\n\n` +
    `If you might act on these thoughts, or you're not safe, please call emergency services or go to the nearest hospital, and try to stay near someone.\n\n` +
    `I'm here too. Can you tell me what's been happening, or whether anyone is with you right now?`
  );
}
