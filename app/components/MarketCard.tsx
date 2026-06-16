'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './ToastProvider'
import { useUser, PLACEHOLDER_USER_ID } from '@/app/context/UserContext'

const BADGE: Record<string, { bg: string; color: string }> = {
  Football:   { bg: '#FAECE7', color: '#993C1D' },
  Basketball: { bg: '#E6F1FB', color: '#185FA5' },
  Campus:     { bg: '#E1F5EE', color: '#0F6E56' },
  Wrestling:  { bg: '#EEEDFE', color: '#3C3489' },
}

function fmtVol(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function closesIn(ts: string) {
  const diff = new Date(ts).getTime() - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Closes in <1h'
  if (h < 24) return `Closes in ${h}h`
  return `Closes in ${Math.ceil(h / 24)}d`
}

type Comment = { id: string; text: string; created_at: string }

type Props = {
  id: string
  question: string
  category: string
  yesPct: number
  noPct: number
  volume: number
  closesAt: string | null
  isLive: boolean
}

export default function MarketCard({ id, question, category, yesPct, noPct, volume, closesAt, isLive }: Props) {
  const expired = closesAt ? new Date(closesAt).getTime() <= Date.now() : false
  const closesLabel = closesAt ? closesIn(closesAt) : null
  // Bet state
  const [selected, setSelected] = useState<'YES' | 'NO' | null>(null)
  const [amount, setAmount] = useState(50)
  const [loading, setLoading] = useState(false)

  // Comment state
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  const { addToast } = useToast()
  const { points, deductPoints, incrementBets } = useUser()

  // ── Bet logic ─────────────────────────────────────────
  function toggleSelect(dir: 'YES' | 'NO') {
    if (expired) return
    setSelected(prev => (prev === dir ? null : dir))
  }

  const pct    = selected === 'YES' ? yesPct / 100 : selected === 'NO' ? noPct / 100 : 0
  const payout = pct > 0 && amount > 0 ? Math.round(amount / pct) : 0
  const profit = payout - amount

  function setQuick(val: number | 'half' | 'all') {
    if (val === 'half') setAmount(Math.floor(points * 0.5))
    else if (val === 'all') setAmount(points)
    else setAmount(val)
  }

  async function confirmBet() {
    if (!selected || amount <= 0 || amount > points || expired) return
    setLoading(true)
    const { error } = await supabase.from('wagers').insert({
      user_id: PLACEHOLDER_USER_ID,
      market_id: id,
      choice: selected,
      amount,
      odds_at_bet: pct,
    })
    setLoading(false)
    if (error) {
      addToast('Failed to place bet.', 'error')
    } else {
      deductPoints(amount)
      incrementBets()
      setSelected(null)
      addToast(`⬡ Bet placed! ${amount} pts on ${selected}`, 'success')
    }
  }

  // ── Comment logic ──────────────────────────────────────
  async function toggleComments() {
    const opening = !commentsOpen
    setCommentsOpen(opening)
    if (opening && comments.length === 0) {
      setLoadingComments(true)
      const { data } = await supabase
        .from('comments')
        .select('id, text, created_at')
        .eq('market_id', id)
        .order('created_at', { ascending: true })
      setComments(data ?? [])
      setLoadingComments(false)
    }
  }

  async function postComment() {
    const text = commentText.trim()
    if (!text) return
    setPosting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ market_id: id, user_id: PLACEHOLDER_USER_ID, text })
      .select('id, text, created_at')
      .single()
    setPosting(false)
    if (!error && data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    } else if (error) {
      addToast('Failed to post comment.', 'error')
    }
  }

  const badge = BADGE[category] ?? { bg: '#F3F3F3', color: '#555' }
  const commentCount = commentsOpen ? comments.length : 0

  return (
    <div className="bg-white border border-black/8 rounded-xl overflow-hidden hover:border-black/14 transition-colors">

      {/* ── Body ── */}
      <div className="p-4 pb-3">
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: badge.bg, color: badge.color }}
          >
            {category}
          </span>
          {isLive && !expired && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1" style={{ background: '#FAECE7', color: '#C0390B' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-no" />
              Live
            </span>
          )}
          {expired ? (
            <span className="text-[10px] text-faint font-medium">Betting closed</span>
          ) : closesLabel ? (
            <span className="text-[10px] text-faint font-medium">{closesLabel}</span>
          ) : null}
        </div>

        <p className="text-[15px] font-medium leading-snug mb-3">{question}</p>

        {/* Odds cards */}
        <div className={`grid grid-cols-2 gap-2 mb-3 ${expired ? 'opacity-50' : ''}`}>
          <button
            onClick={() => toggleSelect('YES')}
            disabled={expired}
            style={{ background: '#E1F5EE' }}
            className={`rounded-lg p-3 text-left border-2 transition-all ${expired ? 'cursor-not-allowed' : ''} ${
              selected === 'YES'
                ? 'border-yes shadow-[0_0_0_3px_rgba(29,158,117,0.15)]'
                : 'border-transparent hover:border-yes/50'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#1D9E75' }}>Yes</div>
            <div className="text-[26px] font-semibold font-mono leading-none" style={{ color: '#0F6E56' }}>{yesPct}%</div>
          </button>

          <button
            onClick={() => toggleSelect('NO')}
            disabled={expired}
            style={{ background: '#FAECE7' }}
            className={`rounded-lg p-3 text-left border-2 transition-all ${expired ? 'cursor-not-allowed' : ''} ${
              selected === 'NO'
                ? 'border-no shadow-[0_0_0_3px_rgba(192,57,11,0.15)]'
                : 'border-transparent hover:border-no/50'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#C0390B' }}>No</div>
            <div className="text-[26px] font-semibold font-mono leading-none" style={{ color: '#993C1D' }}>{noPct}%</div>
          </button>
        </div>

        {/* Probability bar */}
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: '#FAECE7' }}>
          <div className="h-full bg-yes rounded-full" style={{ width: `${yesPct}%` }} />
        </div>
      </div>

      {/* ── Bet panel ── */}
      {selected && (
        <div className="bg-surface border-t border-black/8 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted w-[90px] shrink-0">Points to bet</span>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-muted">⬡</span>
              <input
                type="number"
                min={1}
                max={points}
                value={amount}
                onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 border border-black/14 rounded-lg px-3 py-1.5 font-mono text-sm bg-white focus:outline-none focus:border-scarlet"
              />
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap mb-3">
            {([50, 100, 250, 500] as const).map(v => (
              <button
                key={v}
                onClick={() => setQuick(v)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-black/14 bg-white text-muted hover:bg-scarlet hover:text-white hover:border-scarlet transition-all"
              >
                {v}
              </button>
            ))}
            <button onClick={() => setQuick('half')} className="text-[11px] px-2.5 py-1 rounded-full border border-black/14 bg-white text-muted hover:bg-scarlet hover:text-white hover:border-scarlet transition-all">50%</button>
            <button onClick={() => setQuick('all')}  className="text-[11px] px-2.5 py-1 rounded-full border border-black/14 bg-white text-muted hover:bg-scarlet hover:text-white hover:border-scarlet transition-all">All in</button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted">
              {payout > 0
                ? <>Bet {amount.toLocaleString()} pts → return <strong className="text-yes font-mono">+{profit.toLocaleString()} pts</strong></>
                : <span className="text-faint">Enter an amount above</span>
              }
            </p>
            <button
              onClick={confirmBet}
              disabled={loading || amount <= 0 || amount > points}
              className="px-5 py-1.5 rounded-full bg-scarlet text-white text-[13px] font-medium hover:bg-scarlet-dark disabled:opacity-40 transition-colors"
            >
              {loading ? '…' : 'Confirm bet'}
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-black/8 bg-[#FAFAF9]">
        <span className="text-[11px] text-faint">⬡ {fmtVol(volume)} vol</span>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-[12px] text-muted hover:text-scarlet transition-colors"
        >
          💬 Talk
          <span className="bg-black/10 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
            {commentCount}
          </span>
        </button>
      </div>

      {/* ── Comments section ── */}
      {commentsOpen && (
        <div className="border-t border-black/8">
          {/* List */}
          <div className="max-h-[260px] overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-[#FAFAF9]">
            {loadingComments ? (
              <p className="text-[13px] text-faint text-center py-1">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-[13px] text-faint text-center py-1">
                No comments yet — be the first.
              </p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-scarlet flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-0.5">
                    RU
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold">RU Student</span>
                      <span className="text-[10px] text-faint">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-[13px] leading-snug text-foreground">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-black/8 bg-[#FAFAF9] flex gap-2 items-end">
            <div className="w-6 h-6 rounded-full bg-scarlet flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
              RU
            </div>
            <textarea
              rows={1}
              placeholder="What's your take?"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  postComment()
                }
              }}
              className="flex-1 resize-none border border-black/14 rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-scarlet leading-snug"
              style={{ minHeight: 36, maxHeight: 100 }}
            />
            <button
              onClick={postComment}
              disabled={posting || !commentText.trim()}
              className="px-3 py-[7px] rounded-lg bg-scarlet text-white text-[13px] font-medium hover:bg-scarlet-dark disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              {posting ? '…' : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
