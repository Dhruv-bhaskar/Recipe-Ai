'use server'

import { createClient } from '@/lib/supabase/server'
import { model } from '@/lib/gemini'
import { revalidatePath } from 'next/cache'
import type { RecipeGenerationParams, GeneratedRecipe } from '@/types/recipe'

export async function generateRecipe(params: RecipeGenerationParams) {
  try {
    console.log('🔵 Starting recipe generation with params:', params)
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User error:', userError)
      return { error: 'Authentication error: ' + userError.message }
    }
    
    if (!user) {
      console.error('❌ No user found')
      return { error: 'Not authenticated. Please log in again.' }
    }

    console.log('✅ User authenticated:', user.id)

    // Build AI prompt
    const prompt = buildRecipePrompt(params)
    console.log('🔵 AI Prompt built')

    // Call Gemini API
    console.log('🔵 Calling Gemini API...')
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    if (!responseText) {
      console.error('❌ No response text from AI')
      return { error: 'AI returned empty response' }
    }

    console.log('✅ Gemini response received')
    console.log('🔵 Parsing AI response...')
    
    const recipe: GeneratedRecipe = JSON.parse(responseText)
    console.log('✅ Recipe parsed:', recipe.name)

    // Save to database
    console.log('🔵 Saving to database...')
    const savedRecipe = await saveRecipeToDatabase(user.id, recipe, supabase)
    console.log('✅ Recipe saved with ID:', savedRecipe.id)

    revalidatePath('/recipes')
    revalidatePath('/dashboard')

    return { success: true, recipe: savedRecipe }
  } catch (error: any) {
    console.error('❌ Recipe generation error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    })
    
    // Return specific error messages
    if (error.message?.includes('API key')) {
      return { error: 'Gemini API key is invalid or missing' }
    }
    if (error.message?.includes('quota')) {
      return { error: 'API quota exceeded. Please try again later.' }
    }
    if (error.message?.includes('JSON')) {
      return { error: 'Failed to parse AI response. Please try again.' }
    }
    
    return { error: 'Failed to generate recipe: ' + error.message }
  }
}

function buildRecipePrompt(params: RecipeGenerationParams): string {
  const {
    ingredients,
    cuisine,
    dietaryRestrictions,
    cookingTime,
    difficulty,
    servings = 4,
  } = params

  let prompt = `You are a professional chef. Generate a recipe using these ingredients: ${ingredients.join(', ')}.`

  if (cuisine) {
    prompt += ` The cuisine should be ${cuisine}.`
  }

  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    prompt += ` Dietary restrictions: ${dietaryRestrictions.join(', ')}.`
  }

  if (cookingTime) {
    prompt += ` Total cooking time should be around ${cookingTime} minutes.`
  }

  if (difficulty) {
    prompt += ` Difficulty level: ${difficulty}.`
  }

  prompt += ` Servings: ${servings}.`

  prompt += `

IMPORTANT: Return ONLY valid JSON (no markdown, no code blocks, no explanations) with this exact structure:
{
  "name": "Recipe Name",
  "description": "Brief description of the dish",
  "cuisine_type": "Italian/Indian/Chinese/etc",
  "difficulty": "easy/medium/hard",
  "prep_time": number (in minutes),
  "cooking_time": number (in minutes),
  "servings": number,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "2 cups",
      "isOptional": false
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Detailed step instruction",
      "duration": "5 minutes"
    }
  ],
  "nutritional_info": {
    "calories": 450,
    "protein": "25g",
    "carbs": "40g",
    "fat": "15g",
    "fiber": "5g"
  },
  "tips": ["Cooking tip 1", "Cooking tip 2"]
}

Make the recipe practical, detailed, and delicious!`

  return prompt
}

async function saveRecipeToDatabase(
  userId: string,
  recipe: GeneratedRecipe,
  supabase: any
) {
  console.log('🔵 Processing ingredients...')
  
  // First, get or create ingredients
  const ingredientIds: Record<string, string> = {}

  for (const ingredient of recipe.ingredients) {
    const ingredientName = ingredient.name.toLowerCase().trim()

    // Check if ingredient exists
    let { data: existingIngredient, error: findError } = await supabase
      .from('ingredients')
      .select('id')
      .ilike('name', ingredientName)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding ingredient:', findError)
    }

    if (!existingIngredient) {
      console.log(`  Creating new ingredient: ${ingredientName}`)
      const { data: newIngredient, error: insertError } = await supabase
        .from('ingredients')
        .insert({ name: ingredientName })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error creating ingredient:', insertError)
        throw new Error(`Failed to create ingredient: ${ingredientName}`)
      }

      existingIngredient = newIngredient
    }

    if (existingIngredient) {
      ingredientIds[ingredient.name] = existingIngredient.id
    }
  }

  console.log('✅ Ingredients processed:', Object.keys(ingredientIds).length)

  // Insert recipe
  console.log('🔵 Inserting recipe...')
  const { data: insertedRecipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      name: recipe.name,
      description: recipe.description,
      cuisine_type: recipe.cuisine_type,
      difficulty: recipe.difficulty,
      prep_time: recipe.prep_time,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      instructions: recipe.instructions,
      nutritional_info: recipe.nutritional_info || null,
      ai_generated: true,
    })
    .select()
    .single()

  if (recipeError) {
    console.error('❌ Recipe insert error:', recipeError)
    throw new Error('Failed to save recipe: ' + recipeError.message)
  }

  console.log('✅ Recipe inserted with ID:', insertedRecipe.id)

  // Insert recipe ingredients
  console.log('🔵 Linking ingredients to recipe...')
  const recipeIngredients = recipe.ingredients.map((ingredient) => ({
    recipe_id: insertedRecipe.id,
    ingredient_id: ingredientIds[ingredient.name],
    quantity: ingredient.quantity,
    is_optional: ingredient.isOptional || false,
  }))

  const { error: linkError } = await supabase
    .from('recipe_ingredients')
    .insert(recipeIngredients)

  if (linkError) {
    console.error('❌ Recipe ingredients link error:', linkError)
    throw new Error('Failed to link ingredients: ' + linkError.message)
  }

  console.log('✅ All ingredients linked')

  return insertedRecipe
}

export async function toggleFavorite(recipeId: string, isFavorite: boolean) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('recipes')
      .update({ is_favorite: !isFavorite })
      .eq('id', recipeId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Toggle favorite error:', error)
      return { error: 'Failed to update favorite status' }
    }

    revalidatePath('/recipes')
    revalidatePath(`/recipes/${recipeId}`)
    revalidatePath('/dashboard')

    return { success: true, isFavorite: !isFavorite }
  } catch (error: any) {
    console.error('Toggle favorite error:', error)
    return { error: 'Failed to update favorite status' }
  }
}

export async function deleteRecipe(recipeId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    // Delete recipe (cascade will delete recipe_ingredients automatically)
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete recipe error:', error)
      return { error: 'Failed to delete recipe' }
    }

    revalidatePath('/recipes')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('Delete recipe error:', error)
    return { error: 'Failed to delete recipe' }
  }
}