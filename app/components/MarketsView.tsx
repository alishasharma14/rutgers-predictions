'use client'

import { useState } from 'react'
import MarketCard from './MarketCard'

const CATEGORIES = ['All', 'Football', 'Basketball', 'Campus', 'Wrestling']

type Market = {
  id: string
  question: string
  category: string
  yesPct: number
  noPct: number
  volume: number
}

export default function MarketsView({ markets }: { markets: Market[] }) {
  const [cat, setCat] = useState('All')

  const filtered = cat === 'All' ? markets : markets.filter(m => m.category === cat)

  return (
    <div>
      {/* Section header + category filter */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <span className="text-base font-semibold">Open markets</span>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                cat === c
                  ? 'bg-scarlet text-white border-scarlet'
                  : 'bg-white border-black/14 text-muted hover:border-scarlet hover:text-scarlet'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No markets in this category yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(m => (
            <MarketCard key={m.id} {...m} />
          ))}
        </div>
      )}
    </div>
  )
}
