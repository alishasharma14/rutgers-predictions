'use client'

import { useUser, START_POINTS } from '@/app/context/UserContext'

export default function NavPoints() {
  const { points } = useUser()
  const delta = points - START_POINTS

  return (
    <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3.5 py-[5px] text-white text-[13px]">
      <span className="leading-none">⬡</span>
      <span className="font-mono font-medium">{points.toLocaleString()}</span>
      {delta !== 0 && (
        <span
          className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
          style={
            delta > 0
              ? { background: 'rgba(29,158,117,0.25)', color: '#5DCAA5' }
              : { background: 'rgba(192,57,11,0.25)',  color: '#F0997B' }
          }
        >
          {delta > 0 ? '+' : ''}{delta.toLocaleString()}
        </span>
      )}
    </div>
  )
}
