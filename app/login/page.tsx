'use client'

import { useActionState, useState } from 'react'
import { login, signup } from './actions'

type FormState = { error?: string; message?: string } | undefined

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginState, loginAction, loginPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => login(formData),
    undefined
  )
  const [signupState, signupAction, signupPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => signup(formData),
    undefined
  )

  const state = mode === 'login' ? loginState : signupState
  const action = mode === 'login' ? loginAction : signupAction
  const pending = mode === 'login' ? loginPending : signupPending

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-full bg-scarlet flex items-center justify-center text-white text-base font-semibold mx-auto mb-3">
          U
        </div>
        <h1 className="text-lg font-semibold">
          <span className="text-scarlet">U</span>Pick
        </h1>
        <p className="text-[13px] text-muted mt-1">Rutgers students only — sign in with your @rutgers.edu email.</p>
      </div>

      <div className="bg-white border border-black/8 rounded-xl overflow-hidden">
        <div className="flex border-b border-black/8">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 text-[13px] font-medium py-2.5 transition-colors ${
              mode === 'login' ? 'text-scarlet border-b-2 border-scarlet' : 'text-muted'
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 text-[13px] font-medium py-2.5 transition-colors ${
              mode === 'signup' ? 'text-scarlet border-b-2 border-scarlet' : 'text-muted'
            }`}
          >
            Sign up
          </button>
        </div>

        <form action={action} className="p-5 flex flex-col gap-3">
          <div>
            <label className="text-[12px] text-muted block mb-1">Rutgers email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="netid@rutgers.edu"
              className="w-full border border-black/14 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-scarlet"
            />
          </div>
          <div>
            <label className="text-[12px] text-muted block mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full border border-black/14 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-scarlet"
            />
          </div>

          {state?.error && <p className="text-[12px] text-no">{state.error}</p>}
          {state?.message && <p className="text-[12px] text-yes">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 px-4 py-2 rounded-lg bg-scarlet text-white text-sm font-medium hover:bg-scarlet-dark disabled:opacity-40 transition-colors"
          >
            {pending ? '…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  )
}
