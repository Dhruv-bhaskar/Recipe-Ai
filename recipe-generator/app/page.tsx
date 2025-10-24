import { Button } from '@/components/ui/button'
import { ChefHat } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <ChefHat className="h-20 w-20 text-orange-500" />
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight">
          Recipe AI
        </h1>
        
        <p className="text-xl text-muted-foreground">
          Transform your ingredients into delicious recipes with the power of AI
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">
              Get Started
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}