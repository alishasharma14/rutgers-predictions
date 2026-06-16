import { supabase } from '@/lib/supabase'
import PositionsView from '../components/PositionsView'

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001'

type Market = { question: string; status: string; resolution: string | null }

export default async function PositionsPage() {
  const { data: wagers } = await supabase
    .from('wagers')
    .select('id, choice, amount, settled, payout, markets(question, status, resolution)')
    .eq('user_id', PLACEHOLDER_USER_ID)
    .order('created_at', { ascending: false })

  const positions = (wagers ?? []).map(w => {
    const raw = w.markets
    const market: Market | null = Array.isArray(raw) ? (raw[0] ?? null) : (raw as Market | null)
    const won = w.settled && market?.resolution === w.choice
    const profit = (w.payout ?? 0) - w.amount

    return {
      id: w.id,
      question: market?.question ?? '',
      marketOpen: market?.status === 'open',
      choice: w.choice as 'YES' | 'NO',
      amount: w.amount,
      settled: w.settled,
      won,
      profit,
    }
  })

  return <PositionsView positions={positions} />
}
