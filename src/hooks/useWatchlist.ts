import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WatchlistItem {
  id: string;
  user_id: string;
  ticker: string;
  created_at: string;
}

// Fetch user's watchlist
export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WatchlistItem[];
    },
  });
}

// Add to watchlist
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticker: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("watchlist").insert({
        user_id: session.session.user.id,
        ticker,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add to watchlist: ${error.message}`);
    },
  });
}

// Remove from watchlist
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticker: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", session.session.user.id)
        .eq("ticker", ticker);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove from watchlist: ${error.message}`);
    },
  });
}
