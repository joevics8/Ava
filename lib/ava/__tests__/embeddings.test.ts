import { describe, it, expect, vi } from 'vitest';
import { embedText, embeddingText, normalizeVector, toPgVector, EMBED_DIMS } from '../embeddings';
import { mergeRecallRows } from '../memory';

const vec = (n: number, x = 0.1) => Array.from({ length: n }, () => x);
const ok = (values: number[]) => ({ ok: true, status: 200, json: async () => ({ embedding: { values } }) }) as unknown as Response;
const bad = (status: number) => ({ ok: false, status, json: async () => ({}) }) as unknown as Response;

describe('embedding helpers', () => {
  it('embeds the tag plus her words only when they add something', () => {
    expect(embeddingText('Cramps', 'my cramps are bad since morning')).toBe('Cramps | my cramps are bad since morning');
    expect(embeddingText('Cramps', 'cramps')).toBe('Cramps');
    expect(embeddingText('Cramps', null)).toBe('Cramps');
  });
  it('normalises and formats for pgvector', () => {
    const n = normalizeVector([3, 4]);
    expect(n[0]).toBeCloseTo(0.6); expect(n[1]).toBeCloseTo(0.8);
    expect(toPgVector([0.5, 0.25])).toBe('[0.5,0.25]');
  });
});

describe('embedText', () => {
  it('returns a normalised vector of the right size', async () => {
    const f = vi.fn().mockResolvedValue(ok(vec(EMBED_DIMS)));
    const v = await embedText('cramps', 'RETRIEVAL_QUERY', { fetchImpl: f as any, apiKey: 'k' });
    expect(v).toHaveLength(EMBED_DIMS);
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.taskType).toBe('RETRIEVAL_QUERY');
    expect(f.mock.calls[0][1].headers['x-goog-api-key']).toBe('k'); // key in a header, not the URL
    expect(f.mock.calls[0][0]).not.toContain('key=');
  });
  it('truncates a longer vector to the stored size', async () => {
    const v = await embedText('x', 'RETRIEVAL_DOCUMENT', { fetchImpl: vi.fn().mockResolvedValue(ok(vec(3072))) as any, apiKey: 'k' });
    expect(v).toHaveLength(EMBED_DIMS);
  });
  it('falls back to the config form when the top-level form is rejected', async () => {
    const f = vi.fn().mockResolvedValueOnce(bad(400)).mockResolvedValueOnce(ok(vec(EMBED_DIMS)));
    const v = await embedText('x', 'RETRIEVAL_QUERY', { fetchImpl: f as any, apiKey: 'k' });
    expect(v).toHaveLength(EMBED_DIMS);
    expect(JSON.parse(f.mock.calls[1][1].body).embedContentConfig.taskType).toBe('RETRIEVAL_QUERY');
  });
  it('returns null (never throws) on failures, empty text, a short vector or a network error', async () => {
    expect(await embedText('x', 'RETRIEVAL_QUERY', { fetchImpl: vi.fn().mockResolvedValue(bad(500)) as any, apiKey: 'k' })).toBeNull();
    expect(await embedText('   ', 'RETRIEVAL_QUERY', { apiKey: 'k' })).toBeNull();
    expect(await embedText('x', 'RETRIEVAL_QUERY', { fetchImpl: vi.fn().mockResolvedValue(ok(vec(10))) as any, apiKey: 'k' })).toBeNull();
    expect(await embedText('x', 'RETRIEVAL_QUERY', { fetchImpl: vi.fn().mockRejectedValue(new Error('net')) as any, apiKey: 'k' })).toBeNull();
  });
});

describe('mergeRecallRows', () => {
  it('unions both matchers without duplicates, newest first', () => {
    const a = [{ id: '1', logged_at: '2026-10-01T00:00:00Z' }, { id: '2', logged_at: '2026-09-01T00:00:00Z' }];
    const b = [{ id: '2', logged_at: '2026-09-01T00:00:00Z' }, { id: '3', logged_at: '2026-10-05T00:00:00Z' }];
    expect(mergeRecallRows(a, b).map(r => r.id)).toEqual(['3', '1', '2']);
  });
});
