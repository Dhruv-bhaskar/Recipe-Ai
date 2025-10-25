'use server'


import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMealPlans(startDate: string, endDate: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    const { data: mealPlans, error } = await supabase
      .from('meal_plans')
      .select(`
        *,
        recipes (
          id,
          name,
          cooking_time,
          prep_time,
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .gte('planned_date', startDate)
      .lte('planned_date', endDate)
      .order('planned_date', { ascending: true })

    if (error) {
      console.error('Get meal plans error:', error)
      return { error: 'Failed to fetch meal plans' }
    }

    return { mealPlans: mealPlans || [] }
  } catch (error: any) {
    console.error('Get meal plans error:', error)
    return { error: 'Failed to fetch meal plans' }
  }
}

export async function addMealPlan(
  recipeId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    // Check if meal already exists for this date/type
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('planned_date', date)
      .eq('meal_type', mealType)
      .single()

    if (existing) {
      // Update existing meal plan
      const { error } = await supabase
        .from('meal_plans')
        .update({ recipe_id: recipeId })
        .eq('id', existing.id)

      if (error) {
        console.error('Update meal plan error:', error)
        return { error: 'Failed to update meal plan' }
      }
    } else {
      // Create new meal plan
      const { error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
          planned_date: date,
          meal_type: mealType,
        })

      if (error) {
        console.error('Create meal plan error:', error)
        return { error: 'Failed to create meal plan' }
      }
    }

    revalidatePath('/meal-plan')
    return { success: true }
  } catch (error: any) {
    console.error('Add meal plan error:', error)
    return { error: 'Failed to add meal plan' }
  }
}

export async function removeMealPlan(mealPlanId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete meal plan error:', error)
      return { error: 'Failed to delete meal plan' }
    }

    revalidatePath('/meal-plan')
    return { success: true }
  } catch (error: any) {
    console.error('Remove meal plan error:', error)
    return { error: 'Failed to remove meal plan' }
  }
}

export async function toggleMealComplete(mealPlanId: string, isCompleted: boolean) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('meal_plans')
      .update({ is_completed: !isCompleted })
      .eq('id', mealPlanId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Toggle complete error:', error)
      return { error: 'Failed to toggle completion' }
    }

    revalidatePath('/meal-plan')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle complete error:', error)
    return { error: 'Failed to toggle completion' }
  }
}

export async function copyWeek(sourceStartDate: string, targetStartDate: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    // Calculate end dates (7 days later)
    const sourceEndDate = new Date(sourceStartDate)
    sourceEndDate.setDate(sourceEndDate.getDate() + 6)
    const sourceEnd = sourceEndDate.toISOString().split('T')[0]

    // Get all meal plans from source week
    const { data: sourceMealPlans, error: fetchError } = await supabase
      .from('meal_plans')
      .select('recipe_id, planned_date, meal_type, notes')
      .eq('user_id', user.id)
      .gte('planned_date', sourceStartDate)
      .lte('planned_date', sourceEnd)

    if (fetchError) {
      console.error('Fetch source meals error:', fetchError)
      return { error: 'Failed to fetch source meals' }
    }

    if (!sourceMealPlans || sourceMealPlans.length === 0) {
      return { error: 'No meals found in source week' }
    }

    // Delete existing meals in target week (if any)
    const targetEndDate = new Date(targetStartDate)
    targetEndDate.setDate(targetEndDate.getDate() + 6)
    const targetEnd = targetEndDate.toISOString().split('T')[0]

    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', user.id)
      .gte('planned_date', targetStartDate)
      .lte('planned_date', targetEnd)

    // Calculate day offset between source and target
    const sourceDateObj = new Date(sourceStartDate)
    const targetDateObj = new Date(targetStartDate)
    const dayDiff = Math.floor(
      (targetDateObj.getTime() - sourceDateObj.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Create new meal plans with adjusted dates
    const newMealPlans = sourceMealPlans.map((meal) => {
      const originalDate = new Date(meal.planned_date)
      originalDate.setDate(originalDate.getDate() + dayDiff)
      const newDate = originalDate.toISOString().split('T')[0]

      return {
        user_id: user.id,
        recipe_id: meal.recipe_id,
        planned_date: newDate,
        meal_type: meal.meal_type,
        notes: meal.notes,
        is_completed: false, // Reset completion status
      }
    })

    const { error: insertError } = await supabase
      .from('meal_plans')
      .insert(newMealPlans)

    if (insertError) {
      console.error('Insert new meals error:', insertError)
      return { error: 'Failed to copy meals' }
    }

    revalidatePath('/meal-plan')
    return { success: true, count: newMealPlans.length }
  } catch (error: any) {
    console.error('Copy week error:', error)
    return { error: 'Failed to copy week' }
  }
}

export async function addCustomMeal(
  customName: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'Not authenticated' }
    }

    // Check if meal already exists for this date/type
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('planned_date', date)
      .eq('meal_type', mealType)
      .single()

    if (existing) {
      // Update existing meal plan
      const { error } = await supabase
        .from('meal_plans')
        .update({ 
          custom_meal_name: customName,
          recipe_id: null // Clear recipe_id if it was set
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Update custom meal error:', error)
        return { error: 'Failed to update meal' }
      }
    } else {
      // Create new meal plan
      const { error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          custom_meal_name: customName,
          planned_date: date,
          meal_type: mealType,
        })

      if (error) {
        console.error('Create custom meal error:', error)
        return { error: 'Failed to add meal' }
      }
    }

    revalidatePath('/meal-plan')
    return { success: true }
  } catch (error: unknown) {
    console.error('Add custom meal error:', error)
    return { error: 'Failed to add meal' }
  }
}