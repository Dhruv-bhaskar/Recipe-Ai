"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/lib/actions/recipes";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean;
}

export function FavoriteButton({
  recipeId,
  isFavorite: initialFavorite,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      // Optimistic update
      setIsFavorite(!isFavorite);

      const result = await toggleFavorite(recipeId, isFavorite);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          isFavorite ? "Removed from favorites" : "Added to favorites"
        );
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className="relative"
    >
      <Heart
        className={`h-5 w-5 transition-all ${
          isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
        }`}
      />
    </Button>
  );
}
