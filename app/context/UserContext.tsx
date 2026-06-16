'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001'
export const START_POINTS = 1000

type Ctx = {
  points: number
  betsPlaced: number
  betPnL: number         // settled bet profit/loss only — bonuses never touch this
  addPoints: (n: number) => void
  deductPoints: (n: number) => void
  addBetPnL: (n: number) => void  // called only on settlement
  incrementBets: () => void
}

const UserContext = createContext<Ctx>({
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
  const [points, setPoints] = useState(START_POINTS)
  const [betsPlaced, setBetsPlaced] = useState(0)
  const [betPnL, setBetPnL] = useState(0)  // loaded from users.bet_pnl, updated server-side on settlement

  useEffect(() => {
    supabase
      .from('users')
      .select('points, bet_pnl')
      .eq('id', PLACEHOLDER_USER_ID)
      .single()
      .then(({ data }) => {
        if (data?.points != null) setPoints(data.points)
        if (data?.bet_pnl != null) setBetPnL(data.bet_pnl)
      })

    supabase
      .from('wagers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', PLACEHOLDER_USER_ID)
      .then(({ count }) => {
        if (count != null) setBetsPlaced(count)
      })
  }, [])

  function persist(next: number) {
    setPoints(next)
    supabase.from('users').update({ points: next }).eq('id', PLACEHOLDER_USER_ID)
  }

  function addPoints(n: number) { persist(points + n) }
  function deductPoints(n: number) { persist(Math.max(0, points - n)) }
  function addBetPnL(n: number) { setBetPnL(prev => prev + n) }
  function incrementBets() { setBetsPlaced(prev => prev + 1) }

  return (
    <UserContext.Provider value={{ points, betsPlaced, betPnL, addPoints, deductPoints, addBetPnL, incrementBets }}>
      {children}
    </UserContext.Provider>
  )
}
