"use client";

import { Copy } from "lucide-react";
import { CopyWeekDialog } from "@/components/copy-week-dialog";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { AddMealDialog } from "@/components/add-meal-dialog";
import { removeMealPlan, toggleMealComplete } from "@/lib/actions/meal-plans";
import Link from "next/link";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";

interface Recipe {
  id: string;
  name: string;
  cuisine_type: string | null;
  difficulty: string | null;
  cooking_time: number | null;
  prep_time: number | null;
  servings: number;
}

interface MealPlan {
  id: string;
  recipe_id: string;
  planned_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  is_completed: boolean;
  recipes: Recipe;
}

export default function MealPlanPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("breakfast");

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );
  const mealTypes: Array<"breakfast" | "lunch" | "dinner" | "snack"> = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
  ];

  const mealTypeLabels = {
    breakfast: "🍳 Breakfast",
    lunch: "🍱 Lunch",
    dinner: "🍽️ Dinner",
    snack: "🍪 Snack",
  };

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch recipes
      const { data: recipesData } = await supabase
        .from("recipes")
        .select(
          "id, name, cuisine_type, difficulty, cooking_time, prep_time, servings"
        )
        .eq("user_id", user.id);

      if (recipesData) {
        setRecipes(recipesData);
      }

      // Fetch meal plans for current week
      await fetchMealPlans();
      setIsLoading(false);
    }

    fetchData();
  }, [currentWeekStart]);

  async function fetchMealPlans() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const weekEnd = addDays(currentWeekStart, 6);
    const startDate = format(currentWeekStart, "yyyy-MM-dd");
    const endDate = format(weekEnd, "yyyy-MM-dd");

    const { data: mealPlansData } = await supabase
      .from("meal_plans")
      .select(
        `
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
      `
      )
      .eq("user_id", user.id)
      .gte("planned_date", startDate)
      .lte("planned_date", endDate);

    if (mealPlansData) {
      setMealPlans(mealPlansData as MealPlan[]);
    }
  }

  const getMealForSlot = (date: Date, mealType: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return mealPlans.find(
      (mp) => mp.planned_date === dateStr && mp.meal_type === mealType
    );
  };

  const handleAddMeal = (
    date: Date,
    mealType: "breakfast" | "lunch" | "dinner" | "snack"
  ) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setSelectedMealType(mealType);
    setDialogOpen(true);
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    const result = await removeMealPlan(mealPlanId);
    if (!result.error) {
      await fetchMealPlans();
    }
  };

  const handleToggleComplete = async (
    mealPlanId: string,
    isCompleted: boolean
  ) => {
    const result = await toggleMealComplete(mealPlanId, isCompleted);
    if (!result.error) {
      await fetchMealPlans();
    }
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meal Plan</h1>
          <p className="text-muted-foreground mt-2">
            Plan your meals for the week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCopyDialogOpen(true)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Week
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <CopyWeekDialog
          isOpen={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          currentWeekStart={currentWeekStart}
          onSuccess={() => {
            fetchMealPlans();
          }}
        />
      </div>

      {/* Week Display */}
      <div className="text-center text-lg font-semibold">
        {format(currentWeekStart, "MMM d")} -{" "}
        {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="font-semibold text-sm text-muted-foreground"></div>
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

          {/* Meal Rows */}
          {mealTypes.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
              {/* Meal Type Label */}
              <div className="flex items-center justify-center text-sm font-medium text-muted-foreground">
                {mealTypeLabels[mealType]}
              </div>

              {/* Day Cells */}
              {weekDays.map((day, i) => {
                const meal = getMealForSlot(day, mealType);

                return (
                  <Card
                    key={i}
                    className={`min-h-[100px] transition-colors ${
                      meal ? "hover:shadow-md" : "hover:border-orange-300"
                    }`}
                  >
                    <CardContent className="p-2 h-full">
                      {meal ? (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              href={`/recipes/${meal.recipe_id}`}
                              className="text-sm font-medium hover:text-orange-600 line-clamp-2 flex-1"
                            >
                              {meal.recipes.name}
                            </Link>
                            <button
                              onClick={() => handleRemoveMeal(meal.id)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              handleToggleComplete(meal.id, meal.is_completed)
                            }
                            className={`w-full text-xs px-2 py-1 rounded ${
                              meal.is_completed
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {meal.is_completed ? (
                              <span className="flex items-center justify-center gap-1">
                                <Check className="h-3 w-3" />
                                Completed
                              </span>
                            ) : (
                              "Mark as done"
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddMeal(day, mealType)}
                          className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Meal Dialog */}
      <AddMealDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchMealPlans();
        }}
        date={selectedDate}
        mealType={selectedMealType}
        recipes={recipes}
      />
    </div>
  );
}
