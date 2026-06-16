import { createClient } from '@/lib/supabase/server'
import { resolveMarket } from './actions'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: markets } = await supabase
    .from('markets')
    .select('id, question, category, status, resolution, wagers(choice, amount)')
    .order('created_at', { ascending: false })

  const open = (markets ?? []).filter(m => m.status === 'open')
  const closed = (markets ?? []).filter(m => m.status !== 'open')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-base font-semibold mb-3">Open markets</h1>
        {open.length === 0 ? (
          <p className="text-sm text-muted">No open markets.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {open.map(m => {
              type W = { choice: string; amount: number }
              const wagers = (m.wagers as W[]) ?? []
              const yesAmt = wagers.filter(w => w.choice === 'YES').reduce((s, w) => s + w.amount, 0)
              const noAmt = wagers.filter(w => w.choice === 'NO').reduce((s, w) => s + w.amount, 0)

              return (
                <div
                  key={m.id}
                  className="bg-white border border-black/8 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug">{m.question}</p>
                    <p className="text-[11px] text-muted mt-1">
                      {m.category} · YES {yesAmt.toLocaleString()} pts · NO {noAmt.toLocaleString()} pts
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={resolveMarket.bind(null, m.id, 'YES')}>
                      <button className="px-3 py-1.5 rounded-full text-[12px] font-medium text-white bg-yes hover:opacity-90 transition-opacity">
                        Resolve YES
                      </button>
                    </form>
                    <form action={resolveMarket.bind(null, m.id, 'NO')}>
                      <button className="px-3 py-1.5 rounded-full text-[12px] font-medium text-white bg-no hover:opacity-90 transition-opacity">
                        Resolve NO
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-base font-semibold mb-3">Closed markets</h1>
        {closed.length === 0 ? (
          <p className="text-sm text-muted">No closed markets yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {closed.map(m => (
              <div
                key={m.id}
                className="bg-white border border-black/8 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap"
              >
                <p className="text-[13px] font-medium leading-snug">{m.question}</p>
                <span className={`text-[12px] font-semibold ${m.resolution === 'YES' ? 'text-yes' : 'text-no'}`}>
                  Resolved {m.resolution}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
