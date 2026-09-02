import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'No token' });

  const BASE = `https://api.telegram.org/bot${token}`;

  // Full description (shown on bot profile page)
  const desc = await fetch(`${BASE}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description:
        'Ava is your private AI cycle and wellness companion. She learns your unique body, remembers your patterns, and talks to you like a friend who actually gets it.\n\n🔒 Your data is never sold or shared.\n💬 Just talk naturally — no forms, no apps.\n🌸 Track symptoms, understand your cycle, ask anything.',
    }),
  }).then(r => r.json());

  // Short description (shown in search results)
  const shortDesc = await fetch(`${BASE}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: 'Your private AI period & wellness companion. Track your cycle, understand your body — privately.',
    }),
  }).then(r => r.json());

  // Bot commands
  const commands = await fetch(`${BASE}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: 'Start or restart Ava' },
        { command: 'today', description: 'Your daily cycle summary' },
        { command: 'log', description: 'Track symptoms, mood or flow' },
        { command: 'premium', description: 'Upgrade for 5 months memory' },
        { command: 'settings', description: 'Update your name, dates, or cycle info' },
        { command: 'report', description: 'Get your monthly cycle PDF (Premium)' },
        { command: 'help', description: 'What can Ava do?' },
      ],
    }),
  }).then(r => r.json());

  return NextResponse.json({ desc, shortDesc, commands });
}
