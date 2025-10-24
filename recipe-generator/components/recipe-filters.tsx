'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, SlidersHorizontal, Heart } from 'lucide-react'

interface RecipeFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCuisine: string
  onCuisineChange: (cuisine: string) => void
  showFavoritesOnly: boolean
  onToggleFavorites: () => void
  sortBy: string
  onSortChange: (sort: string) => void
  cuisines: string[]
  totalCount: number
  filteredCount: number
}

export function RecipeFilters({
  searchQuery,
  onSearchChange,
  selectedCuisine,
  onCuisineChange,
  showFavoritesOnly,
  onToggleFavorites,
  sortBy,
  onSortChange,
  cuisines,
  totalCount,
  filteredCount,
}: RecipeFiltersProps) {
  const hasActiveFilters = searchQuery || selectedCuisine !== 'all' || showFavoritesOnly

  const clearFilters = () => {
    onSearchChange('')
    onCuisineChange('all')
    if (showFavoritesOnly) onToggleFavorites()
  }

  return (
    <div className="space-y-4">
      {/* Search and Favorite Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          size="icon"
          onClick={onToggleFavorites}
          className="shrink-0"
        >
          <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        
        {/* Cuisine Filter */}
        <Select value={selectedCuisine} onValueChange={onCuisineChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All cuisines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cuisines</SelectItem>
            {cuisines.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="time-asc">Quickest First</SelectItem>
            <SelectItem value="time-desc">Longest First</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} recipes
        </div>
      )}
    </div>
  )
}