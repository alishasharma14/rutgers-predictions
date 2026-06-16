'use client'

import { useUser, START_POINTS } from '@/app/context/UserContext'

export default function HeroBar() {
  const { points, betsPlaced, betPnL } = useUser()
  // ROI = settled bet P&L only — daily bonuses never inflate this
  const roi = Math.round((betPnL / START_POINTS) * 100)

  const stats = [
    { val: points.toLocaleString(),           lbl: 'Your points' },
    { val: '#—',                              lbl: 'Your rank' },
    { val: betsPlaced.toString(),             lbl: 'Bets placed' },
    { val: (roi >= 0 ? '+' : '') + roi + '%', lbl: 'ROI' },
  ]

  return (
    <div className="bg-scarlet rounded-xl px-5 py-4 mb-5 text-white">
      <div className="grid grid-cols-4 divide-x divide-white/20">
        {stats.map(s => (
          <div key={s.lbl} className="text-center px-3 first:pl-0 last:pr-0">
            <div className="text-[22px] font-semibold font-mono leading-none">{s.val}</div>
            <div className="text-[11px] uppercase tracking-wide opacity-70 mt-1.5">{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
