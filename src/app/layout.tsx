import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '@/styles/globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingActionBar from '@/components/collection/FloatingActionBar'
import { SampleCartProvider } from '@/context/SampleCartContext'

const bdoGrotesk = localFont({
  src: '../../public/fonts/BDOGrotesk-Regular.ttf',
  variable: '--font-bdo',
  weight: '400',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'GIO Architectural Tile & Stone',
    template: '%s | GIO Tile',
  },
  description: 'Tile Collections Curated Expressly for Commercial Specifications',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={bdoGrotesk.variable}>
      <body>
        <SampleCartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingActionBar />
        </SampleCartProvider>
      </body>
    </html>
  )
}
