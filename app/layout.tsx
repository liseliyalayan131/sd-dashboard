import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/ToastContext'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'dashboard by conf',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
