export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          dietary_preferences: string[]
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          dietary_preferences?: string[]
          avatar_url?: string | null
        }
        Update: {
          username?: string | null
          full_name?: string | null
          dietary_preferences?: string[]
          avatar_url?: string | null
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          cuisine_type: string | null
          difficulty: 'easy' | 'medium' | 'hard' | null
          cooking_time: number | null
          prep_time: number | null
          servings: number
          instructions: Json
          nutritional_info: Json | null
          image_url: string | null
          is_favorite: boolean
          ai_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          cuisine_type?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          cooking_time?: number | null
          prep_time?: number | null
          servings?: number
          instructions: Json
          nutritional_info?: Json | null
          image_url?: string | null
          is_favorite?: boolean
          ai_generated?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          cuisine_type?: string | null
          difficulty?: 'easy' | 'medium' | 'hard' | null
          cooking_time?: number | null
          prep_time?: number | null
          servings?: number
          instructions?: Json
          nutritional_info?: Json | null
          image_url?: string | null
          is_favorite?: boolean
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
        }
        Update: {
          name?: string
          category?: string | null
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity: string
          is_optional: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity: string
          is_optional?: boolean
          notes?: string | null
        }
        Update: {
          quantity?: string
          is_optional?: boolean
          notes?: string | null
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          planned_date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          is_completed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          planned_date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          is_completed?: boolean
          notes?: string | null
        }
        Update: {
          planned_date?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          is_completed?: boolean
          notes?: string | null
        }
      }
      user_pantry: {
        Row: {
          id: string
          user_id: string
          ingredient_id: string
          quantity: string | null
          expiry_date: string | null
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ingredient_id: string
          quantity?: string | null
          expiry_date?: string | null
        }
        Update: {
          quantity?: string | null
          expiry_date?: string | null
        }
      }
    }
  }
}