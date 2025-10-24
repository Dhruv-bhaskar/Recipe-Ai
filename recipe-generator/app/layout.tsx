import { Toaster } from 'sonner'
import { Inter } from 'next/font/google'
import type { Metadata } from "next";

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: "Recipe AI - Generate Delicious Recipes with AI",
  description: "Transform your ingredients into delicious recipes with the power of AI. Plan meals, save favorites, and cook with confidence.",
  keywords: ["recipe generator", "AI recipes", "meal planning", "cooking", "food"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "Recipe AI - AI-Powered Recipe Generator",
    description: "Generate personalized recipes from your ingredients using AI",
    type: "website",
    locale: "en_US",
  },
};