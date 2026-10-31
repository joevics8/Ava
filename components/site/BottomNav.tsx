'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Calculator, House, LayoutDashboard } from 'lucide-react';

export interface NavItem {
  key: 'home' | 'tools' | 'blog' | 'dashboard';
  href: string;
  label: string;
}

const ICONS = { home: House, tools: Calculator, blog: BookOpen, dashboard: LayoutDashboard } as const;

// Phone-only bottom bar: the four places people actually go. Hidden from
// md up, where the header carries the same links. Hrefs and labels come from
// the server so they follow the page language (/es/herramientas, ...).
export function BottomNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname() || '/';

  const isActive = (it: NavItem) => {
    if (it.key === 'home') return pathname === it.href;
    return pathname === it.href || pathname.startsWith(`${it.href}/`);
  };

  return (
    <nav
      aria-label={label}
      className="safe-area-pb fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(it => {
          const Icon = ICONS[it.key];
          const active = isActive(it);
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-2 text-[0.8125rem] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-ink hover:text-primary'
                }`}
              >
                {active && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-marigold" />}
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
