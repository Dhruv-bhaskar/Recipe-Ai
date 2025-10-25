'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
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
  const queryClient = useQueryClient()

  // Define query function
  const fetchDashboardData = async () => {
    const supabase = createClient()

    // Get logged-in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    // Fetch counts in parallel
    const [recipesRes, favoritesRes, mealPlansRes] = await Promise.all([
      supabase.from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase.from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_favorite', true),
      supabase.from('meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('planned_date', new Date().toISOString().split('T')[0]),
    ])

    return {
      user,
      recipeCount: recipesRes.count ?? 0,
      favoriteCount: favoritesRes.count ?? 0,
      mealPlanCount: mealPlansRes.count ?? 0,
    }
  }

  // Use React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardData,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Prefetch recipes page data on mount
  useEffect(() => {
    const prefetchRecipes = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await queryClient.prefetchQuery({
        queryKey: ['recipes'],
        queryFn: async () => {
          const { data } = await supabase
            .from('recipes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          return data || []
        },
        staleTime: 60 * 1000,
      })
    }

    prefetchRecipes()
  }, [queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="text-center text-red-500 py-10">
        Failed to load dashboard data.
      </div>
    )
  }

  const { user, recipeCount, favoriteCount, mealPlanCount } = data

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.user_metadata.full_name || "Chef"}! 👋
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
            <div className="text-2xl font-bold">{recipeCount}</div>
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
            <div className="text-2xl font-bold">{favoriteCount}</div>
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
            <div className="text-2xl font-bold">{mealPlanCount}</div>
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

      {/* Getting Started Section */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Here&apos;s what you can do with Recipe AI
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
                Schedule recipes for the week and never wonder what&apos;s for dinner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}