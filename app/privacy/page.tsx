import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy Policy — Ava' };
export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 prose prose-pink">
      <h1>Privacy Policy</h1>
      <p>Last updated: August 2026</p>
      <p>Ava is committed to protecting your health data. Here is what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Your Telegram ID (to identify your account)</li>
        <li>Cycle dates and health logs you choose to share with Ava</li>
        <li>Conversation summaries (10 words max per exchange) stored to power memory</li>
      </ul>
      <h2>What we never do</h2>
      <ul>
        <li>Sell your data to third parties</li>
        <li>Share your health information with advertisers</li>
        <li>Store full conversation transcripts</li>
      </ul>
      <h2>Data retention</h2>
      <p>Free users: 14 days of memory logs. Premium users: up to 5 months. You can request full deletion anytime by messaging Ava: "delete my data".</p>
      <h2>Contact</h2>
      <p>Questions? Message us at support@avahealth.app</p>
    </main>
  );
}
