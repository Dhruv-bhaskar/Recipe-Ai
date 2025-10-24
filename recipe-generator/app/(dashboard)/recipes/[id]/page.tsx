import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/actions/auth'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, ChefHat, ArrowLeft, Heart } from 'lucide-react'
import Link from 'next/link'
import { FavoriteButton } from '@/components/favorite-button'
import { DeleteRecipeButton } from '@/components/delete-recipe-button'

interface RecipePageProps {
  params: {
    id: string
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const user = await getUser()
  const supabase = await createClient()

  // Fetch recipe
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (error || !recipe) {
    notFound()
  }

  // Fetch recipe ingredients
  const { data: recipeIngredients } = await supabase
    .from('recipe_ingredients')
    .select(`
      *,
      ingredients (
        id,
        name
      )
    `)
    .eq('recipe_id', recipe.id)

  const instructions = recipe.instructions as any[]
  const nutritionalInfo = recipe.nutritional_info as any

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ✅ LOCATION 1: Back Button and Delete Button Row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/recipes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Link>
        </Button>
        <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.name} />
      </div>

      {/* Recipe Header */}
      <div className="space-y-4">
        {/* ✅ LOCATION 2: Title and Favorite Button Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-4xl font-bold">{recipe.name}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">{recipe.description}</p>
            )}
          </div>
          <FavoriteButton recipeId={recipe.id} isFavorite={recipe.is_favorite} />
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap gap-2">
          {recipe.cuisine_type && (
            <Badge variant="secondary">
              <ChefHat className="mr-1 h-3 w-3" />
              {recipe.cuisine_type}
            </Badge>
          )}
          {recipe.difficulty && (
            <Badge variant="outline">
              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            </Badge>
          )}
          {recipe.prep_time && (
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              Prep: {recipe.prep_time} min
            </Badge>
          )}
          {recipe.cooking_time && (
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              Cook: {recipe.cooking_time} min
            </Badge>
          )}
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            {recipe.servings} servings
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Ingredients & Nutrition */}
        <div className="md:col-span-1 space-y-6">
          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                Everything you need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipeIngredients?.map((item: any) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <div className="flex-1">
                      <span className="font-medium">{item.quantity}</span>
                      {' '}
                      <span>{item.ingredients.name}</span>
                      {item.is_optional && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Nutritional Info */}
          {nutritionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Nutrition</CardTitle>
                <CardDescription>Per serving</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  {nutritionalInfo.calories && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Calories</dt>
                      <dd className="font-medium">{nutritionalInfo.calories}</dd>
                    </div>
                  )}
                  {nutritionalInfo.protein && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Protein</dt>
                      <dd className="font-medium">{nutritionalInfo.protein}</dd>
                    </div>
                  )}
                  {nutritionalInfo.carbs && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Carbs</dt>
                      <dd className="font-medium">{nutritionalInfo.carbs}</dd>
                    </div>
                  )}
                  {nutritionalInfo.fat && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fat</dt>
                      <dd className="font-medium">{nutritionalInfo.fat}</dd>
                    </div>
                  )}
                  {nutritionalInfo.fiber && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Fiber</dt>
                      <dd className="font-medium">{nutritionalInfo.fiber}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Instructions */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>
                Follow these steps to make your dish
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {instructions.map((step: any) => (
                  <li key={step.step} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm leading-relaxed">{step.instruction}</p>
                      {step.duration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ⏱️ {step.duration}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
