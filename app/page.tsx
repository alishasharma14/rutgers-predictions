import { createClient } from '@/lib/supabase/server'
import HeroBar from './components/HeroBar'
import DailyBanner from './components/DailyBanner'
import MarketsView from './components/MarketsView'

type Wager = { choice: string; amount: number }

export default async function Home() {
  const supabase = await createClient()
  const { data: markets } = await supabase
    .from('markets')
    .select('id, question, category, closes_at, is_live, wagers(choice, amount)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const processed = (markets ?? []).map(m => {
    const wagers: Wager[] = (m.wagers as Wager[]) ?? []
    const yesAmt = wagers.filter(w => w.choice === 'YES').reduce((s, w) => s + w.amount, 0)
    const noAmt  = wagers.filter(w => w.choice === 'NO').reduce((s, w) => s + w.amount, 0)
    const volume = yesAmt + noAmt
    const yesPct = volume > 0 ? Math.round((yesAmt / volume) * 100) : 50
    return {
      id: m.id,
      question: m.question,
      category: m.category,
      yesPct,
      noPct: 100 - yesPct,
      volume,
      closesAt: m.closes_at,
      isLive: m.is_live,
    }
  })

  return (
    <>
      <HeroBar />
      <DailyBanner />
      <MarketsView markets={processed} />
    </>
  )
}
