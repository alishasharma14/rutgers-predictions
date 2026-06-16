'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function resolveMarket(marketId: string, resolution: 'YES' | 'NO') {
  const { data: market } = await supabase
    .from('markets')
    .select('id, status')
    .eq('id', marketId)
    .single()

  if (!market || market.status !== 'open') return

  const { data: wagers } = await supabase
    .from('wagers')
    .select('id, user_id, choice, amount, odds_at_bet')
    .eq('market_id', marketId)
    .eq('settled', false)

  for (const w of wagers ?? []) {
    const won = w.choice === resolution
    const odds = w.odds_at_bet ?? 0.5
    const payout = won ? Math.round(w.amount / odds) : 0
    const pnlDelta = won ? payout - w.amount : -w.amount

    await supabase.from('wagers').update({ settled: true, payout }).eq('id', w.id)

    const { data: user } = await supabase
      .from('users')
      .select('points, bet_pnl')
      .eq('id', w.user_id)
      .single()

    if (user) {
      await supabase
        .from('users')
        .update({
          points: user.points + payout,
          bet_pnl: user.bet_pnl + pnlDelta,
        })
        .eq('id', w.user_id)
    }
  }

  await supabase
    .from('markets')
    .update({ status: 'closed', resolution })
    .eq('id', marketId)

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/leaderboard')
  revalidatePath('/positions')
}
