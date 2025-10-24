export interface RecipeIngredient {
  name: string
  quantity: string
  isOptional?: boolean
}

export interface RecipeStep {
  step: number
  instruction: string
  duration?: string
}

export interface NutritionalInfo {
  calories?: number
  protein?: string
  carbs?: string
  fat?: string
  fiber?: string
}

export interface GeneratedRecipe {
  name: string
  description: string
  cuisine_type: string
  difficulty: 'easy' | 'medium' | 'hard'
  prep_time: number
  cooking_time: number
  servings: number
  ingredients: RecipeIngredient[]
  instructions: RecipeStep[]
  nutritional_info?: NutritionalInfo
  tips?: string[]
}

export interface RecipeGenerationParams {
  ingredients: string[]
  cuisine?: string
  dietaryRestrictions?: string[]
  cookingTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  servings?: number
}