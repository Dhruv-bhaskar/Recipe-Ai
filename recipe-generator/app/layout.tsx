import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import "./globals.css"
import { ReactNode } from 'react'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ChefAI - Generate Delicious Recipes with AI",
  description: "Transform your ingredients into delicious recipes with the power of AI. Plan meals, save favorites, and cook with confidence.",
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}