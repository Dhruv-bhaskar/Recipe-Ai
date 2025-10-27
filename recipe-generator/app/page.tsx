'use client' 

import { Button } from '@/components/ui/button'
import { ChefHat, Sparkles, Calendar, Heart, Search, Smartphone, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// FeatureCard Component (inline)
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="p-6 hover:shadow-xl transition-all duration-300 bg-card border-border group cursor-pointer rounded-lg border shadow-md bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-food.jpg"
            alt="Delicious food spread"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/80" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="animate-fade-in">
            <ChefHat className="h-20 w-20 mx-auto mb-6 text-white animate-bounce" />
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Welcome to ChefAI
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your ingredients into delicious recipes with AI and meal planning
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="default" className="text-lg border-[0.2px] border-white/40 bg-black/30 hover:bg-black/35 hover:scale-102 transition-all">
                <Link href="/signup">
                  Get Started
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg bg-white/10 text-white border-white/20 hover:bg-white/20 hover:scale-105 transition-all">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-primary/15 to-secondary/12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features to make your cooking journey delightful
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={Sparkles}
              title="AI Recipe Generation"
              description="Get personalized recipes based on your ingredients and preferences using advanced AI"
            />
            <FeatureCard
              icon={Calendar}
              title="Weekly Meal Planning"
              description="Plan your entire week with smart meal suggestions and organize your cooking schedule"
            />
            <FeatureCard
              icon={Heart}
              title="Favorite Recipes"
              description="Save and organize your favorite recipes for quick access anytime"
            />
            <FeatureCard
              icon={Search}
              title="Smart Search"
              description="Find recipes quickly with powerful search and filter options"
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile Responsive"
              description="Access your recipes anywhere, on any device with our responsive design"
            />
            <FeatureCard
              icon={PlusCircle}
              title="Custom Recipes"
              description="Add your own recipes or customize AI-generated ones to match your taste"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Start Cooking?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of home cooks who are already using ChefAI to create amazing meals
          </p>
          <Button asChild size="lg" className="text-lg">
            <Link href="/signup">
              Start Cooking with AI
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 ChefAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
