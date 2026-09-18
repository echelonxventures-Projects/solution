import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Consultancy Platform - AI-Powered Expert Consultants',
  description: 'Connect with verified expert consultants worldwide with AI-powered matching, chatbot, and real-time insights',
  keywords: ['consultancy', 'experts', 'consultants', 'AI', 'professional advice', 'online sessions'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}