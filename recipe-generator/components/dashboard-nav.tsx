'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ChefHat, Home, Calendar, BookOpen, User, LogOut, Menu } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useTransition } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'

interface DashboardNavProps {
  user: SupabaseUser
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/recipes', label: 'Recipes', icon: BookOpen },
    { href: '/meal-plan', label: 'Meal Plan', icon: Calendar },
  ]

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  // Prefetch page data on hover
  const prefetchPage = async (href: string) => {
    const supabase = createClient()

    if (href === '/dashboard') {
      await queryClient.prefetchQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('No user')

          const [recipesRes, favoritesRes, mealPlansRes] = await Promise.all([
            supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_favorite', true),
            supabase.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('planned_date', new Date().toISOString().split('T')[0]),
          ])

          return {
            user,
            recipeCount: recipesRes.count ?? 0,
            favoriteCount: favoritesRes.count ?? 0,
            mealPlanCount: mealPlansRes.count ?? 0,
          }
        },
        staleTime: 2 * 60 * 1000,
      })
    } else if (href === '/recipes') {
      await queryClient.prefetchQuery({
        queryKey: ['recipes'],
        queryFn: async () => {
          const { data } = await supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          return data || []
        },
        staleTime: 60 * 1000,
      })
    } else if (href === '/meal-plan') {
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekEnd = addDays(currentWeekStart, 6)

      await queryClient.prefetchQuery({
        queryKey: ['mealPlans', currentWeekStart, user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('meal_plans')
            .select(`*, recipes (*)`)
            .eq('user_id', user.id)
            .gte('planned_date', format(currentWeekStart, 'yyyy-MM-dd'))
            .lte('planned_date', format(weekEnd, 'yyyy-MM-dd'))
          return data || []
        },
        staleTime: 3 * 60 * 1000,
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="font-bold text-xl">Recipe AI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => prefetchPage(item.href)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user.user_metadata.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={handleSignOut}
                disabled={isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isPending ? 'Signing out...' : 'Sign Out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}