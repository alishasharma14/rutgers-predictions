'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'default' | 'success' | 'error'
type Toast = { id: number; msg: string; type: ToastType }
type Ctx = { addToast: (msg: string, type?: ToastType) => void }

const ToastCtx = createContext<Ctx>({ addToast: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((msg: string, type: ToastType = 'default') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-animate px-4 py-2.5 rounded-lg text-[13px] text-white max-w-[300px] shadow-lg ${
              t.type === 'success' ? 'bg-yes' : t.type === 'error' ? 'bg-no' : 'bg-nav'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
