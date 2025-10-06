import './globals.css'

import type {Metadata} from 'next'
import {DM_Sans, DM_Mono} from 'next/font/google'
import {Toaster} from '@/components/ui/sonner'
import {ThemeProvider} from '@/providers/theme-provider'
const dmSans = DM_Sans({
  variable: '--font-dn-serif',
  subsets: ['latin', 'latin-ext'],
  weight: '300'
})

const dmSansMono = DM_Mono({
  weight: '400',
  variable: '--font-dn-serif-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Athena',
  description: 'Athena',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSansMono.variable} antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem>
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
