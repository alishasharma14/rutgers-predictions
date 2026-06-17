import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveMarket, createMarket } from './actions'

const CATEGORIES = ['Football', 'Basketball', 'Wrestling', 'Campus']

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const { data: markets } = await supabase
    .from('markets')
    .select('id, question, category, status, resolution, wagers(choice, amount)')
    .order('created_at', { ascending: false })

  const open = (markets ?? []).filter(m => m.status === 'open')
  const closed = (markets ?? []).filter(m => m.status !== 'open')

  return (
    <div className="flex flex-col gap-8">

      {/* ── Create market ── */}
      <div>
        <h1 className="text-base font-semibold mb-3">Create market</h1>
        <div className="bg-white border border-black/8 rounded-xl p-4">
          <form action={createMarket} className="flex flex-col gap-3">
            <div>
              <label className="text-[12px] text-muted block mb-1">Question</label>
              <input
                name="question"
                required
                placeholder="Will Rutgers beat Penn State?"
                className="w-full border border-black/14 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-scarlet"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-muted block mb-1">Category</label>
                <select
                  name="category"
                  required
                  className="w-full border border-black/14 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-scarlet"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] text-muted block mb-1">Closes at (optional)</label>
                <input
                  name="closes_at"
                  type="datetime-local"
                  className="w-full border border-black/14 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-scarlet"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_live" id="is_live" className="accent-scarlet" />
              <label htmlFor="is_live" className="text-[13px] text-muted cursor-pointer">Mark as Live</label>
            </div>
            <button
              type="submit"
              className="self-start px-4 py-1.5 rounded-full bg-scarlet text-white text-[13px] font-medium hover:bg-scarlet-dark transition-colors"
            >
              Create
            </button>
          </form>
        </div>
      </div>

      {/* ── Open markets ── */}
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
              const noAmt  = wagers.filter(w => w.choice === 'NO').reduce((s, w) => s + w.amount, 0)

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

      {/* ── Closed markets ── */}
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
