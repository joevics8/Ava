import { supabase } from '@/lib/supabase';
import { Lang } from '@/lib/site';

export interface BlogPost {
  slug: string; title: string; excerpt: string | null; content: string; language: Lang;
  category: string | null; read_time: number | null; faqs: { q: string; a: string }[] | null;
  translation_group: string | null; published_at: string | null; updated_at: string | null;
}

const COLS = 'slug,title,excerpt,content,language,category,read_time,faqs,translation_group,published_at,updated_at';

// Reads never throw: if the table is missing or Supabase is down the pages
// render an empty state instead of a 500 (and the sitemap simply omits posts).
export async function listPosts(lang: Lang, limit = 50): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase.from('blog_posts').select(COLS).eq('published', true).eq('language', lang)
      .order('published_at', { ascending: false }).limit(limit);
    if (error) { console.error('listPosts', error.message); return []; }
    return (data ?? []) as BlogPost[];
  } catch (e) { console.error('listPosts', e); return []; }
}

export async function getPost(lang: Lang, slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase.from('blog_posts').select(COLS).eq('published', true).eq('language', lang).eq('slug', slug).maybeSingle();
    if (error) { console.error('getPost', error.message); return null; }
    return (data as BlogPost) ?? null;
  } catch (e) { console.error('getPost', e); return null; }
}

/** Published translations of a post (same translation_group), including itself. */
export async function getTranslations(group: string | null): Promise<{ language: Lang; slug: string }[]> {
  if (!group) return [];
  try {
    const { data } = await supabase.from('blog_posts').select('language,slug').eq('published', true).eq('translation_group', group);
    return (data ?? []) as { language: Lang; slug: string }[];
  } catch { return []; }
}

/** A few other published posts in the same language, same category first, newest first. Used for internal links. */
export async function relatedPosts(lang: Lang, excludeSlug: string, category: string | null, limit = 3): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase.from('blog_posts').select(COLS).eq('published', true).eq('language', lang)
      .neq('slug', excludeSlug).order('published_at', { ascending: false }).limit(24);
    if (error) { console.error('relatedPosts', error.message); return []; }
    const rows = (data ?? []) as BlogPost[];
    const same = rows.filter(r => category && r.category === category);
    const rest = rows.filter(r => !(category && r.category === category));
    return [...same, ...rest].slice(0, limit);
  } catch (e) { console.error('relatedPosts', e); return []; }
}
