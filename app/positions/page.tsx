import { supabase } from '@/lib/supabase'

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001'

type Market = { question: string; status: string; resolution: string | null }

export default async function PositionsPage() {
  const { data: wagers } = await supabase
    .from('wagers')
    .select('id, choice, amount, settled, payout, markets(question, status, resolution)')
    .eq('user_id', PLACEHOLDER_USER_ID)
    .order('created_at', { ascending: false })

  return (
    <>
      {!wagers || wagers.length === 0 ? (
        <div className="bg-white border border-black/8 rounded-xl px-5 py-8 text-center text-sm text-muted">
          No positions yet — place a bet to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {wagers.map(w => {
            const raw = w.markets
            const market: Market | null = Array.isArray(raw) ? (raw[0] ?? null) : (raw as Market | null)
            const won  = w.settled && market?.resolution === w.choice
            const lost = w.settled && market?.resolution !== null && market?.resolution !== w.choice

            const statusLabel = w.settled ? (won ? '✓ Won' : '✗ Lost') : '● Open'
            const statusCls   = w.settled ? (won ? 'text-yes' : 'text-no') : 'text-blue'
            const ptsCls      = w.settled ? (won ? 'text-yes' : 'text-no') : ''
            const profit      = (w.payout ?? 0) - w.amount
            const ptsLabel    = w.settled
              ? `${profit >= 0 ? '+' : ''}${profit.toLocaleString()} pts`
              : `${w.amount.toLocaleString()} pts`

            return (
              <div
                key={w.id}
                className="bg-white border border-black/8 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap hover:border-black/14 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug truncate">{market?.question}</p>
                  <p className="text-[11px] text-muted mt-1">
                    {market?.status === 'open' ? 'Open' : 'Closed'} ·{' '}
                    Bet{' '}
                    <strong className={w.choice === 'YES' ? 'text-yes' : 'text-no'}>
                      {w.choice}
                    </strong>
                    {' · '}{w.amount.toLocaleString()} pts wagered
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
    </>
  )
}
