const GEMINI_PRO_VISION = 'gemini-3-flash-preview';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

// ─── Download Telegram photo as base64 ───────────────────────────────────────

export async function getTelegramPhotoBase64(
  fileId: string
): Promise<{ base64: string; mimeType: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  // Step 1: Get file path from Telegram
  const fileRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  );
  const fileData = await fileRes.json();
  const filePath = fileData?.result?.file_path;
  if (!filePath) return null;

  // Step 2: Download the file
  const downloadRes = await fetch(
    `https://api.telegram.org/file/bot${token}/${filePath}`
  );
  if (!downloadRes.ok) return null;

  const buffer = await downloadRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // Detect mime type from file extension
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

  return { base64, mimeType };
}

// ─── Detect what kind of image was sent ──────────────────────────────────────

export async function detectImageType(
  base64: string,
  mimeType: string,
  caption?: string
): Promise<'ovulation_strip' | 'pregnancy_test' | 'other'> {
  const prompt = caption
    ? `The user sent a photo with caption: "${caption}". What type of image is this likely to be?`
    : `Look at this image. What type of image is this?`;

  const res = await fetch(geminiUrl(GEMINI_PRO_VISION), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: `${prompt}\n\nReply with ONLY one of: ovulation_strip, pregnancy_test, other` },
        ],
      }],
      generationConfig: { maxOutputTokens: 20 },
    }),
  });

  const data = await res.json();
  const result = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || 'other';

  if (result.includes('ovulation')) return 'ovulation_strip';
  if (result.includes('pregnancy')) return 'pregnancy_test';
  return 'other';
}

// ─── Analyse ovulation test strip ─────────────────────────────────────────────

export async function analyseOvulationStrip(
  base64: string,
  mimeType: string
): Promise<{ result: string; isPositive: boolean; summary: string }> {
  const res = await fetch(geminiUrl(GEMINI_PRO_VISION), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          {
            text: `This is an ovulation LH test strip. Analyse it carefully.

Look at the test line (T) compared to the control line (C):
- If the test line is as dark or darker than the control line → POSITIVE (LH surge, ovulation likely in 12-36 hours)
- If the test line is lighter than the control line → NEGATIVE
- If test line is very faint → LOW

Reply in this exact JSON format (no markdown):
{
  "reading": "POSITIVE|NEGATIVE|LOW|UNCLEAR",
  "line_description": "brief description of what you see",
  "confidence": "high|medium|low",
  "advice": "one warm friendly sentence of advice based on the result"
}`,
          },
        ],
      }],
      generationConfig: { maxOutputTokens: 300 },
    }),
  });

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    const isPositive = parsed.reading === 'POSITIVE';
    const summary = `Ovulation strip: ${parsed.reading} — ${parsed.line_description}`;
    const result = `*Ovulation Test Result: ${parsed.reading}* ${isPositive ? '✨' : '⚪'}\n\n${parsed.line_description}\n\n${parsed.advice}`;
    return { result, isPositive, summary };
  } catch {
    return {
      result: `I could see the strip but had trouble reading it clearly. Try taking the photo in better lighting, flat against a white surface 🌸`,
      isPositive: false,
      summary: 'Ovulation strip: unclear reading',
    };
  }
}

// ─── Analyse pregnancy test ───────────────────────────────────────────────────

export async function analysePregnancyTest(
  base64: string,
  mimeType: string
): Promise<{ result: string; isPositive: boolean; summary: string }> {
  const res = await fetch(geminiUrl(GEMINI_PRO_VISION), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          {
            text: `This is a pregnancy test. Analyse it carefully.

- Two lines (even a faint second line) → POSITIVE
- One line only → NEGATIVE
- No lines or unclear → INVALID

Reply in this exact JSON format (no markdown):
{
  "reading": "POSITIVE|NEGATIVE|INVALID|UNCLEAR",
  "line_description": "brief description of what you see",
  "confidence": "high|medium|low",
  "advice": "one warm, sensitive, friendly sentence based on the result — be gentle regardless of outcome"
}`,
          },
        ],
      }],
      generationConfig: { maxOutputTokens: 300 },
    }),
  });

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    const isPositive = parsed.reading === 'POSITIVE';
    const summary = `Pregnancy test: ${parsed.reading}`;
    const emoji = isPositive ? '🌸' : '⚪';
    const result = `*Pregnancy Test: ${parsed.reading}* ${emoji}\n\n${parsed.line_description}\n\n${parsed.advice}\n\n_Remember — a faint line is still a line. If unsure, test again in 2 days with first morning urine._`;
    return { result, isPositive, summary };
  } catch {
    return {
      result: `I could see the test but had trouble reading it. Try a clearer photo in good lighting 🌸`,
      isPositive: false,
      summary: 'Pregnancy test: unclear',
    };
  }
}

// ─── Handle generic image ─────────────────────────────────────────────────────

export async function analyseGenericImage(
  base64: string,
  mimeType: string,
  caption?: string
): Promise<string> {
  const res = await fetch(geminiUrl(GEMINI_PRO_VISION), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          {
            text: `You are Ava, a warm cycle and wellness companion. The user sent this image${caption ? ` with caption: "${caption}"` : ''}.

Respond helpfully in 2-3 sentences. If it's health-related, give warm, non-diagnostic insight. If it's not health-related, respond naturally. Never be clinical.`,
          },
        ],
      }],
      generationConfig: { maxOutputTokens: 200 },
    }),
  });

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    || `I can see your photo! Could you tell me a bit more about what you'd like help with? 🌸`;
}
