'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUser } from "@/lib/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChefHat, Calendar, BookOpen, Heart, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [recipeCount, setRecipeCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [mealPlanCount, setMealPlanCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Get counts
      const { count: recipes } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: favorites } = await supabase
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_favorite', true)

      const { count: mealPlans } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('planned_date', new Date().toISOString().split('T')[0])

      setRecipeCount(recipes || 0)
      setFavoriteCount(favorites || 0)
      setMealPlanCount(mealPlans || 0)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user!.user_metadata.full_name || "Chef"}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to create some delicious recipes?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipeCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Your recipe collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favoriteCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Your favorite recipes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meal Plans</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealPlanCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Upcoming meals planned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/recipes/generate" prefetch={true}>
                Generate Recipe
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Here's what you can do with Recipe AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <ChefHat className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Generate AI Recipes</h3>
              <p className="text-sm text-muted-foreground">
                Enter ingredients you have and let AI create personalized
                recipes for you
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Save & Organize</h3>
              <p className="text-sm text-muted-foreground">
                Keep all your favorite recipes in one place and mark favorites
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Plan Your Meals</h3>
              <p className="text-sm text-muted-foreground">
                Schedule recipes for the week and never wonder what's for dinner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
