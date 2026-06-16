'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const RUTGERS_DOMAINS = ['@rutgers.edu', '@scarletmail.rutgers.edu']

function validateRutgersEmail(email: string): string | null {
  const lower = email.toLowerCase()
  if (!RUTGERS_DOMAINS.some(domain => lower.endsWith(domain))) {
    return 'Use your @rutgers.edu or @scarletmail.rutgers.edu email.'
  }
  return null
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const domainError = validateRutgersEmail(email)
  if (domainError) return { error: domainError }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/')
}

export async function signup(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const domainError = validateRutgersEmail(email)
  if (domainError) return { error: domainError }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (!data.session) {
    return { message: 'Check your Rutgers email to confirm your account, then log in.' }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
