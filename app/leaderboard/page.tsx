import { createClient } from '@/lib/supabase/server'

const RANK_STYLE: Record<number, string> = {
  0: 'text-[#B8860B]', // gold
  1: 'text-[#808080]', // silver
  2: 'text-[#A0522D]', // bronze
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const [{ data: users }, { data: settledWagers }] = await Promise.all([
    supabase.from('users').select('id, email, points, bet_pnl'),
    supabase.from('wagers').select('user_id').eq('settled', true),
  ])

  const wagerCounts: Record<string, number> = {}
  for (const w of settledWagers ?? []) {
    wagerCounts[w.user_id] = (wagerCounts[w.user_id] ?? 0) + 1
  }

  const ranked = (users ?? [])
    .filter(u => (wagerCounts[u.id] ?? 0) >= 3)
    .sort((a, b) => b.bet_pnl - a.bet_pnl)

  return (
    <div className="bg-white border border-black/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-black/8 flex items-center justify-between">
        <span className="text-base font-semibold">UPick standings</span>
        <span className="text-[12px] text-faint">Ranked by ROI · min 3 bets</span>
      </div>

      {ranked.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted">
          No qualified users yet — need 3+ settled wagers to appear.
        </div>
      ) : (
        ranked.map((user, i) => {
          const roi = (user.bet_pnl / 1000) * 100
          const positive = roi >= 0
          const rankCls = RANK_STYLE[i] ?? 'text-muted'
          const initial = user.email[0].toUpperCase()

          return (
            <div
              key={user.id}
              className="grid grid-cols-[36px_1fr_80px_60px] items-center gap-2 px-5 py-3 border-b border-black/8 last:border-0 hover:bg-surface transition-colors"
            >
              <div className={`text-[13px] font-semibold font-mono text-center ${rankCls}`}>
                #{i + 1}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full bg-scarlet flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                >
                  {initial}
                </div>
                <span className="text-[13px] font-medium truncate">{user.email.split('@')[0]}</span>
              </div>
              <div className="text-[13px] font-semibold font-mono text-right">
                {user.points.toLocaleString()}
              </div>
              <div className={`text-[13px] font-semibold text-right ${positive ? 'text-yes' : 'text-no'}`}>
                {positive ? '+' : ''}{roi.toFixed(1)}%
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
