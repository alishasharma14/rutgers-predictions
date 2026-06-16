'use client'

import { useEffect, useState } from 'react'
import { useToast } from './ToastProvider'
import { useUser } from '@/app/context/UserContext'

export default function DailyBanner() {
  const [claimed, setClaimed] = useState(false)
  const { addToast } = useToast()
  const { addPoints } = useUser()

  useEffect(() => {
    const today = new Date().toDateString()
    setClaimed(localStorage.getItem('sp_daily') === today)
  }, [])

  function claim() {
    if (claimed) return
    const today = new Date().toDateString()
    setClaimed(true)
    localStorage.setItem('sp_daily', today)
    addPoints(100)
    addToast('⬡ 100 points received', 'success')
  }

  return (
    <div className="bg-nav rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 mb-5 flex-wrap">
      <div className="text-white">
        <strong className="block text-sm font-semibold">Daily check-in bonus</strong>
        <span className="text-[12px] text-white/60">Claim 100 free points every day to stay in the game.</span>
      </div>
      <button
        onClick={claim}
        disabled={claimed}
        className="px-4 py-2 rounded-full bg-scarlet text-white text-[13px] font-medium whitespace-nowrap hover:bg-scarlet-dark transition-colors disabled:bg-[#555] disabled:text-[#999] disabled:cursor-not-allowed"
      >
        {claimed ? 'Claimed ✓' : 'Claim 100 pts'}
      </button>
    </div>
  )
}
