'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy } from "lucide-react"
import { CopyWeekDialog } from "@/components/copy-week-dialog"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns"
import { AddMealDialog } from "@/components/add-meal-dialog"
import { removeMealPlan, toggleMealComplete } from "@/lib/actions/meal-plans"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Loader2,
} from "lucide-react"

interface Recipe {
  id: string
  name: string
  cuisine_type: string | null
  difficulty: string | null
  cooking_time: number | null
  prep_time: number | null
  servings: number
}

interface MealPlan {
  id: string
  recipe_id: string
  planned_date: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  is_completed: boolean
  recipes: Recipe
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export default function MealPlanPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast")

  const queryClient = useQueryClient()

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"]

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: "🍳 Breakfast",
    lunch: "🍱 Lunch",
    dinner: "🍽️ Dinner",
    snack: "🍪 Snack",
  }

  // ---------- Fetch User ----------
  const fetchUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    return user
  }

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  // ---------- Fetch Recipes ----------
  const fetchRecipes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("recipes")
      .select("id, name, cuisine_type, difficulty, cooking_time, prep_time, servings")
      .eq("user_id", user!.id)

    return (data ?? []) as Recipe[]
  }

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: fetchRecipes,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  // ---------- Fetch Meal Plans ----------
  const fetchMealPlans = async () => {
    const supabase = createClient()
    const weekEnd = addDays(currentWeekStart, 6)
    const startDate = format(currentWeekStart, "yyyy-MM-dd")
    const endDate = format(weekEnd, "yyyy-MM-dd")

    const { data } = await supabase
      .from("meal_plans")
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
      .eq("user_id", user!.id)
      .gte("planned_date", startDate)
      .lte("planned_date", endDate)

    return (data ?? []) as MealPlan[]
  }

  const {
    data: mealPlans = [],
    isLoading,
  } = useQuery({
    queryKey: ['mealPlans', currentWeekStart, user?.id],
    queryFn: fetchMealPlans,
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  })

  // Prefetch adjacent weeks
  useEffect(() => {
    if (!user) return

    const prefetchAdjacentWeeks = async () => {
      const supabase = createClient()
      const nextWeek = addWeeks(currentWeekStart, 1)
      const prevWeek = subWeeks(currentWeekStart, 1)

      // Prefetch next week
      const nextWeekEnd = addDays(nextWeek, 6)
      await queryClient.prefetchQuery({
        queryKey: ['mealPlans', nextWeek, user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('meal_plans')
            .select(`*, recipes (*)`)
            .eq('user_id', user.id)
            .gte('planned_date', format(nextWeek, 'yyyy-MM-dd'))
            .lte('planned_date', format(nextWeekEnd, 'yyyy-MM-dd'))
          return data || []
        },
        staleTime: 3 * 60 * 1000,
      })

      // Prefetch previous week
      const prevWeekEnd = addDays(prevWeek, 6)
      await queryClient.prefetchQuery({
        queryKey: ['mealPlans', prevWeek, user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('meal_plans')
            .select(`*, recipes (*)`)
            .eq('user_id', user.id)
            .gte('planned_date', format(prevWeek, 'yyyy-MM-dd'))
            .lte('planned_date', format(prevWeekEnd, 'yyyy-MM-dd'))
          return data || []
        },
        staleTime: 3 * 60 * 1000,
      })
    }

    prefetchAdjacentWeeks()
  }, [currentWeekStart, user, queryClient])

  // ---------- Mutations ----------
  const removeMutation = useMutation({
    mutationFn: (mealPlanId: string) => removeMealPlan(mealPlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      toggleMealComplete(id, isCompleted),
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ['mealPlans'] })
      const prevData = queryClient.getQueryData<MealPlan[]>(['mealPlans', currentWeekStart, user?.id])
      if (prevData) {
        queryClient.setQueryData(['mealPlans', currentWeekStart, user?.id], prevData.map(mp =>
          mp.id === id ? { ...mp, is_completed: !isCompleted } : mp
        ))
      }
      return { prevData }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(['mealPlans', currentWeekStart, user?.id], context.prevData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] })
    },
  })

  // ---------- Helpers ----------
  const getMealForSlot = (date: Date, mealType: MealType) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return mealPlans.find(mp => mp.planned_date === dateStr && mp.meal_type === mealType)
  }

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // Prefetch recipe details on hover
  const prefetchRecipe = async (recipeId: string) => {
    const supabase = createClient()
    await queryClient.prefetchQuery({
      queryKey: ['recipe', recipeId],
      queryFn: async () => {
        const [recipeRes, ingredientsRes] = await Promise.all([
          supabase.from('recipes').select('*').eq('id', recipeId).single(),
          supabase.from('recipe_ingredients').select(`*, ingredients (*)`).eq('recipe_id', recipeId)
        ])
        return { recipe: recipeRes.data, ingredients: ingredientsRes.data }
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meal Plan</h1>
          <p className="text-muted-foreground mt-2">Plan your meals for the week</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCopyDialogOpen(true)} className="gap-2">
            <Copy className="h-4 w-4" /> Copy Week
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <CopyWeekDialog
          isOpen={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          currentWeekStart={currentWeekStart}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['mealPlans'] })}
        />
      </div>

      {/* Week Display */}
      <div className="text-center text-lg font-semibold">
        {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div></div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`text-center p-2 rounded-lg ${
                  format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                    ? "bg-orange-100 text-orange-900 font-semibold"
                    : "text-sm font-medium"
                }`}
              >
                <div>{format(day, "EEE")}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          {mealTypes.map(mealType => (
            <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
              <div className="flex items-center justify-center text-sm font-medium text-muted-foreground">
                {mealTypeLabels[mealType]}
              </div>

              {weekDays.map((day, i) => {
                const meal = getMealForSlot(day, mealType)
                return (
                  <Card key={i} className={`min-h-[100px] transition-colors ${meal ? "hover:shadow-md" : "hover:border-orange-300"}`}>
                    <CardContent className="p-2 h-full">
                      {meal ? (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              href={`/recipes/${meal.recipe_id}`}
                              className="text-sm font-medium hover:text-orange-600 line-clamp-2 flex-1"
                              onMouseEnter={() => prefetchRecipe(meal.recipe_id)}
                            >
                              {meal.recipes.name}
                            </Link>
                            <button
                              onClick={() => removeMutation.mutate(meal.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              toggleMutation.mutate({
                                id: meal.id,
                                isCompleted: !meal.is_completed,
                              })
                            }
                            className={`w-full text-xs px-2 py-1 rounded ${
                              meal.is_completed
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {meal.is_completed ? (
                              <span className="flex items-center justify-center gap-1">
                                <Check className="h-3 w-3" /> Completed
                              </span>
                            ) : (
                              "Mark as done"
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDate(format(day, "yyyy-MM-dd"))
                            setSelectedMealType(mealType)
                            setDialogOpen(true)
                          }}
                          className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <AddMealDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['mealPlans'] })
        }}
        date={selectedDate}
        mealType={selectedMealType}
        recipes={recipes}
      />
    </div>
  )
}