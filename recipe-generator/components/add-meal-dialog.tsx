'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Clock, Users, Loader2, Plus } from 'lucide-react'
import { addMealPlan, addCustomMeal } from '@/lib/actions/meal-plans'
import { toast } from 'sonner'

interface Recipe {
  id: string
  name: string
  cuisine_type: string | null
  difficulty: string | null
  cooking_time: number | null
  prep_time: number | null
  servings: number
}

interface AddMealDialogProps {
  isOpen: boolean
  onClose: () => void
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipes: Recipe[]
}

export function AddMealDialog({
  isOpen,
  onClose,
  date,
  mealType,
  recipes,
}: AddMealDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [customMealName, setCustomMealName] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectRecipe = (recipeId: string): void => {
    startTransition(async () => {
      const result = await addMealPlan(recipeId, date, mealType)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Recipe added to meal plan!')
        onClose()
        setSearchQuery('')
      }
    })
  }

  const handleAddCustomMeal = (): void => {
    if (!customMealName.trim()) {
      toast.error('Please enter a meal name')
      return
    }

    startTransition(async () => {
      const result = await addCustomMeal(customMealName.trim(), date, mealType)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Meal added to plan!')
        onClose()
        setCustomMealName('')
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleAddCustomMeal()
    }
  }

  const mealTypeLabels = {
    breakfast: '🍳 Breakfast',
    lunch: '🍱 Lunch',
    dinner: '🍽️ Dinner',
    snack: '🍪 Snack',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Add {mealTypeLabels[mealType]} for{' '}
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </DialogTitle>
          <DialogDescription>
            Choose from your recipes or add a custom meal name
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="recipes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipes">My Recipes</TabsTrigger>
            <TabsTrigger value="custom">Custom Meal</TabsTrigger>
          </TabsList>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Recipe List */}
            <ScrollArea className="h-[400px] pr-4">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No recipes found' : 'No recipes in your collection'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe.id)}
                      disabled={isPending}
                      className="w-full text-left p-4 rounded-lg border hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold">{recipe.name}</h4>
                          {isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {recipe.cuisine_type && (
                            <Badge variant="secondary" className="text-xs">
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
                              <Clock className="h-3 w-3" />
                              <span>
                                {(recipe.prep_time || 0) + (recipe.cooking_time || 0)} min
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{recipe.servings} servings</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Custom Meal Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customMeal">Meal Name</Label>
                <Input
                  id="customMeal"
                  placeholder='e.g., "Leftover Pizza", "Ordered Sushi", "Mom&apos;s Recipe"'
                  value={customMealName}
                  onChange={(e) => setCustomMealName(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <p className="text-xs text-muted-foreground">
                  Add any meal that&apos;s not in your recipe collection
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Use custom meals for:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                  <li>Restaurant orders or takeout</li>
                  <li>Leftovers from previous meals</li>
                  <li>Family recipes not yet added</li>
                  <li>Quick placeholder names</li>
                </ul>
              </div>

              <Button
                onClick={handleAddCustomMeal}
                disabled={isPending || !customMealName.trim()}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Meal
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}