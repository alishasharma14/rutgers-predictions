'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Markets' },
  { href: '/positions', label: 'My positions' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export default function PageTabs() {
  const pathname = usePathname()
  return (
    <div className="flex border-b border-black/8 mb-5 -mx-4 px-4">
      {TABS.map(t => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
              active
                ? 'text-scarlet border-scarlet font-medium'
                : 'text-muted border-transparent hover:text-foreground'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
