'use client'

import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, X, Sparkles } from 'lucide-react'
import { generateRecipe } from '@/lib/actions/recipes'
import { useRouter } from 'next/navigation'

export default function GenerateRecipePage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState<string[]>([])
  const [currentIngredient, setCurrentIngredient] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('')
  const [cookingTime, setCookingTime] = useState('')
  const [servings, setServings] = useState('4')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()])
      setCurrentIngredient('')
    }
  }

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  }

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient')
      return
    }

    setIsGenerating(true)
    setError('')

    const result = await generateRecipe({
      ingredients,
      cuisine: cuisine || undefined,
      difficulty: difficulty || undefined,
      cookingTime: cookingTime ? parseInt(cookingTime) : undefined,
      servings: parseInt(servings),
    })

    setIsGenerating(false)

    if (result.error) {
      setError(result.error)
    } else if (result.recipe) {
      // Redirect to the generated recipe
      toast.success('Meal generated successfully!')
      router.push(`/recipes/${result.recipe.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Recipe</h1>
        <p className="text-muted-foreground mt-2">
          Tell us what ingredients you have, and AI will create a delicious recipe for you!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
          <CardDescription>Provide details for your custom recipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Ingredients Input */}
          <div className="space-y-2">
            <Label htmlFor="ingredient">Ingredients *</Label>
            <div className="flex gap-2">
              <Input
                id="ingredient"
                placeholder="e.g., chicken, tomatoes, garlic"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addIngredient} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Ingredient Tags */}
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {ingredients.map((ingredient) => (
                  <Badge key={ingredient} variant="secondary" className="pl-3 pr-1">
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Cuisine Type */}
          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine Type (Optional)</Label>
            <Select value={cuisine} onValueChange={setCuisine}>
              <SelectTrigger id="cuisine">
                <SelectValue placeholder="Any cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="mexican">Mexican</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="thai">Thai</SelectItem>
                <SelectItem value="american">American</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level (Optional)</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Any difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cooking Time & Servings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cookingTime">Cooking Time (minutes)</Label>
              <Input
                id="cookingTime"
                type="number"
                placeholder="30"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || ingredients.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Recipe...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Recipe with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}