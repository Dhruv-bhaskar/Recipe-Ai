export const runtime = 'edge'
export const preferredRegion = 'bom1'

import { getUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChefHat, Calendar, BookOpen, Heart } from "lucide-react";

export default async function DashboardPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Get user's recipe count
  const { count: recipeCount } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  // Get favorite count
  const { count: favoriteCount } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .eq("is_favorite", true);

  // Get upcoming meal plans
  const { count: mealPlanCount } = await supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .gte("planned_date", new Date().toISOString().split("T")[0]);

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
