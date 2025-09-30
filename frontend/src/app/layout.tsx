import './globals.css'

import type {Metadata} from 'next'
import {Roboto_Mono, Roboto} from 'next/font/google'
import {Toaster} from '@/components/ui/sonner'

const roboto = Roboto({
  variable: '--font-source-sans-3',
  subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
  variable: '--font-source-sans-3-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Athena',
  description: 'Study Companion',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body
        className={`${roboto.variable} ${robotoMono.variable} antialiased`}
      >
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
