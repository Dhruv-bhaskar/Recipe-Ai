'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Clock, Users, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { RecipeFilters } from '@/components/recipe-filters'
import { RecipeGridSkeleton } from '@/components/recipe-skeleton'
import { startOfWeek, addDays, format } from 'date-fns'

interface Recipe {
  id: string
  name: string
  description: string | null
  cuisine_type: string | null
  difficulty: string | null
  prep_time: number | null
  cooking_time: number | null
  servings: number
  is_favorite: boolean
  ai_generated: boolean
  created_at: string
}

export default function RecipesPage() {
  const queryClient = useQueryClient()
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  // Fetch recipes with React Query
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recipes:', error)
        return []
      }

      return (data || []) as Recipe[]
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Prefetch meal plan data
  useEffect(() => {
    const prefetchMealPlans = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekEnd = addDays(currentWeekStart, 6)
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')

      await queryClient.prefetchQuery({
        queryKey: ['mealPlans', currentWeekStart, user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('meal_plans')
            .select(`
              *,
              recipes (
                id,
                name,
                cuisine_type,
                difficulty,
                cooking_time,
                prep_time,
                servings
              )
            `)
            .eq('user_id', user.id)
            .gte('planned_date', startDate)
            .lte('planned_date', endDate)
          return data || []
        },
        staleTime: 3 * 60 * 1000,
      })
    }

    prefetchMealPlans()
  }, [queryClient])

  // Prefetch individual recipe pages on hover
  const prefetchRecipe = async (recipeId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await queryClient.prefetchQuery({
      queryKey: ['recipe', recipeId],
      queryFn: async () => {
        const [recipeRes, ingredientsRes] = await Promise.all([
          supabase
            .from('recipes')
            .select('*')
            .eq('id', recipeId)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('recipe_ingredients')
            .select(`
              *,
              ingredients (id, name)
            `)
            .eq('recipe_id', recipeId)
        ])
        return { recipe: recipeRes.data, ingredients: ingredientsRes.data }
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  // Get unique cuisines
  const cuisines = useMemo(() => {
    return Array.from(
      new Set(recipes.map(r => r.cuisine_type).filter(Boolean))
    ).sort() as string[]
  }, [recipes])

  // Apply filters and sorting
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes]

    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCuisine !== 'all') {
      filtered = filtered.filter(recipe => recipe.cuisine_type === selectedCuisine)
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(recipe => recipe.is_favorite)
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'time-asc':
        filtered.sort((a, b) => {
          const timeA = (a.prep_time || 0) + (a.cooking_time || 0)
          const timeB = (b.prep_time || 0) + (b.cooking_time || 0)
          return timeA - timeB
        })
        break
      case 'time-desc':
        filtered.sort((a, b) => {
          const timeA = (a.prep_time || 0) + (a.cooking_time || 0)
          const timeB = (b.prep_time || 0) + (b.cooking_time || 0)
          return timeB - timeA
        })
        break
    }

    return filtered
  }, [recipes, searchQuery, selectedCuisine, showFavoritesOnly, sortBy])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <RecipeGridSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Recipes</h1>
          <p className="text-muted-foreground mt-2">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} in your collection
          </p>
        </div>
        <Button asChild>
          <Link href="/recipes/generate">
            <Plus className="mr-2 h-4 w-4" />
            Generate Recipe
          </Link>
        </Button>
      </div>

      {/* Filters */}
      {recipes.length > 0 && (
        <RecipeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCuisine={selectedCuisine}
          onCuisineChange={setSelectedCuisine}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          cuisines={cuisines}
          totalCount={recipes.length}
          filteredCount={filteredRecipes.length}
        />
      )}

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven&apos;t created any recipes yet.
            </p>
            <Button asChild>
              <Link href="/recipes/generate">Create Your First Recipe</Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredRecipes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No recipes match your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedCuisine('all')
                setShowFavoritesOnly(false)
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group"
              onMouseEnter={() => prefetchRecipe(recipe.id)}
            >
              <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="group-hover:text-orange-600 transition-colors">
                      {recipe.name}
                    </CardTitle>
                    {recipe.is_favorite && (
                      <span className="text-red-500">❤️</span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {recipe.cuisine_type && (
                      <Badge variant="secondary" className="text-xs">
                        <ChefHat className="mr-1 h-3 w-3" />
                        {recipe.cuisine_type}
                      </Badge>
                    )}
                    {recipe.difficulty && (
                      <Badge variant="outline" className="text-xs">
                        {recipe.difficulty}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {(recipe.prep_time || recipe.cooking_time) && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {(recipe.prep_time || 0) + (recipe.cooking_time || 0)} min
                        </span>
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{recipe.servings} servings</span>
                      </div>
                    )}
                  </div>

                  {recipe.ai_generated && (
                    <Badge variant="outline" className="text-xs">
                      ✨ AI Generated
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}