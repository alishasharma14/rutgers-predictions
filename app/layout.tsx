import type { Metadata } from 'next'
import { DM_Mono, DM_Sans } from 'next/font/google'
import { ToastProvider } from './components/ToastProvider'
import { UserProvider } from './context/UserContext'
import NavPoints from './components/NavPoints'
import PageTabs from './components/PageTabs'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ScarletPicks',
  description: 'Rutgers Virtual Prediction Market',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-surface text-foreground">
        <UserProvider>
          <ToastProvider>
            <nav className="bg-nav sticky top-0 z-50">
              <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-scarlet flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    S
                  </div>
                  <span className="font-semibold text-base leading-none">
                    <span className="text-scarlet">Scarlet</span>
                    <span className="text-white">Picks</span>
                  </span>
                </div>

                {/* Right: live points pill + avatar */}
                <div className="flex items-center gap-3">
                  <NavPoints />
                  <div className="w-[30px] h-[30px] rounded-full bg-scarlet flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                    RU
                  </div>
                </div>
              </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 pt-6 pb-10">
              <PageTabs />
              {children}
            </main>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  )
}
