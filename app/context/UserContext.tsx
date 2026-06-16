'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export const START_POINTS = 1000

type Ctx = {
  userId: string | null
  email: string | null
  points: number
  betsPlaced: number
  betPnL: number         // settled bet profit/loss only — bonuses never touch this
  addPoints: (n: number) => void
  deductPoints: (n: number) => void
  addBetPnL: (n: number) => void  // called only on settlement
  incrementBets: () => void
}

const UserContext = createContext<Ctx>({
  userId: null,
  email: null,
  points: START_POINTS,
  betsPlaced: 0,
  betPnL: 0,
  addPoints: () => {},
  deductPoints: () => {},
  addBetPnL: () => {},
  incrementBets: () => {},
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [points, setPoints] = useState(START_POINTS)
  const [betsPlaced, setBetsPlaced] = useState(0)
  const [betPnL, setBetPnL] = useState(0)  // loaded from users.bet_pnl, updated server-side on settlement

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      setEmail(data.user.email ?? null)

      supabase
        .from('users')
        .select('points, bet_pnl')
        .eq('id', data.user.id)
        .single()
        .then(({ data: row }) => {
          if (row?.points != null) setPoints(row.points)
          if (row?.bet_pnl != null) setBetPnL(row.bet_pnl)
        })

      supabase
        .from('wagers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', data.user.id)
        .then(({ count }) => {
          if (count != null) setBetsPlaced(count)
        })
    })
  }, [])

  function persist(next: number) {
    setPoints(next)
    if (userId) supabase.from('users').update({ points: next }).eq('id', userId)
  }

  function addPoints(n: number) { persist(points + n) }
  function deductPoints(n: number) { persist(Math.max(0, points - n)) }
  function addBetPnL(n: number) { setBetPnL(prev => prev + n) }
  function incrementBets() { setBetsPlaced(prev => prev + 1) }

  return (
    <UserContext.Provider value={{ userId, email, points, betsPlaced, betPnL, addPoints, deductPoints, addBetPnL, incrementBets }}>
      {children}
    </UserContext.Provider>
  )
}
