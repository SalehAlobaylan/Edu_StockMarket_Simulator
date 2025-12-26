import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  timezone: string | null;
  default_capital: number | null;
  default_commission: number | null;
  default_slippage: number | null;
  default_stop_loss: number | null;
  default_take_profit: number | null;
  max_position_pct: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch user's profile
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export interface UpdateProfileInput {
  full_name?: string;
  timezone?: string;
  default_capital?: number;
  default_commission?: number;
  default_slippage?: number;
  default_stop_loss?: number;
  default_take_profit?: number;
  max_position_pct?: number;
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(input)
        .eq("user_id", session.session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
}
