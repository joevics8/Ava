import { Lang, homePath, hubPath } from '@/lib/site';
import { ui } from '@/lib/ui-strings';
import type { NavItem } from './BottomNav';

/** The four primary destinations, localised. Shared by the header and the bottom bar. */
export function navItems(lang: Lang): NavItem[] {
  const t = ui(lang);
  return [
    { key: 'home', href: homePath(lang), label: t.home },
    { key: 'tools', href: hubPath(lang, 'tools'), label: t.tools },
    { key: 'blog', href: hubPath(lang, 'blog'), label: t.blog },
    { key: 'dashboard', href: '/dashboard', label: t.dashboard },
  ];
}
