'use client'

import { useState } from 'react'

type Position = {
  id: string
  question: string
  marketOpen: boolean
  choice: 'YES' | 'NO'
  amount: number
  settled: boolean
  won: boolean
  profit: number
}

const FILTERS = ['All', 'Open', 'Settled'] as const

export default function PositionsView({ positions }: { positions: Position[] }) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All')

  const settled = positions.filter(p => p.settled)
  const open = positions.filter(p => !p.settled)
  const wins = settled.filter(p => p.won)
  const losses = settled.filter(p => !p.won)
  const totalPnL = settled.reduce((s, p) => s + p.profit, 0)

  const filtered =
    filter === 'Open' ? open : filter === 'Settled' ? settled : positions

  if (positions.length === 0) {
    return (
      <div className="bg-white border border-black/8 rounded-xl px-5 py-8 text-center text-sm text-muted">
        No positions yet — place a bet to get started.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="bg-white border border-black/8 rounded-xl px-5 py-4">
        <div className="grid grid-cols-4 divide-x divide-black/8">
          <div className="text-center px-2 first:pl-0 last:pr-0">
            <div className={`text-[20px] font-semibold font-mono leading-none ${totalPnL >= 0 ? 'text-yes' : 'text-no'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString()}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-faint mt-1.5">Total P&L</div>
          </div>
          <div className="text-center px-2 first:pl-0 last:pr-0">
            <div className="text-[20px] font-semibold font-mono leading-none text-yes">{wins.length}</div>
            <div className="text-[11px] uppercase tracking-wide text-faint mt-1.5">Wins</div>
          </div>
          <div className="text-center px-2 first:pl-0 last:pr-0">
            <div className="text-[20px] font-semibold font-mono leading-none text-no">{losses.length}</div>
            <div className="text-[11px] uppercase tracking-wide text-faint mt-1.5">Losses</div>
          </div>
          <div className="text-center px-2 first:pl-0 last:pr-0">
            <div className="text-[20px] font-semibold font-mono leading-none">{open.length}</div>
            <div className="text-[11px] uppercase tracking-wide text-faint mt-1.5">Open</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
              filter === f
                ? 'bg-scarlet text-white border-scarlet'
                : 'bg-white border-black/14 text-muted hover:border-scarlet hover:text-scarlet'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No positions in this filter.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => {
            const statusLabel = p.settled ? (p.won ? '✓ Won' : '✗ Lost') : '● Open'
            const statusCls = p.settled ? (p.won ? 'text-yes' : 'text-no') : 'text-blue'
            const ptsCls = p.settled ? (p.won ? 'text-yes' : 'text-no') : ''
            const ptsLabel = p.settled
              ? `${p.profit >= 0 ? '+' : ''}${p.profit.toLocaleString()} pts`
              : `${p.amount.toLocaleString()} pts`

            return (
              <div
                key={p.id}
                className="bg-white border border-black/8 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap hover:border-black/14 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug truncate">{p.question}</p>
                  <p className="text-[11px] text-muted mt-1">
                    {p.marketOpen ? 'Open' : 'Closed'} ·{' '}
                    Bet{' '}
                    <strong className={p.choice === 'YES' ? 'text-yes' : 'text-no'}>
                      {p.choice}
                    </strong>
                    {' · '}{p.amount.toLocaleString()} pts wagered
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[15px] font-semibold font-mono ${ptsCls}`}>{ptsLabel}</div>
                  <div className={`text-[11px] mt-0.5 font-medium ${statusCls}`}>{statusLabel}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
