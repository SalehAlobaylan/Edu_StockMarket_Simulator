import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RiskProfile {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean | null;
  max_position_pct: number | null;
  max_notional: number | null;
  max_leverage: number | null;
  max_drawdown_pct: number | null;
  stop_loss_pct: number | null;
  take_profit_pct: number | null;
  trailing_stop_pct: number | null;
  allow_short: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateRiskProfileInput {
  name: string;
  is_default?: boolean;
  max_position_pct?: number;
  max_notional?: number;
  max_leverage?: number;
  max_drawdown_pct?: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
  trailing_stop_pct?: number;
  allow_short?: boolean;
}

export interface UpdateRiskProfileInput extends Partial<CreateRiskProfileInput> {
  id: string;
}

// Fetch all risk profiles for current user
export function useRiskProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["risk-profiles", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("risk_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as RiskProfile[];
    },
    enabled: !!user,
  });
}

// Get default risk profile
export function useDefaultRiskProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["risk-profile-default", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("risk_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error) throw error;
      return data as RiskProfile | null;
    },
    enabled: !!user,
  });
}

// Create a new risk profile
export function useCreateRiskProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRiskProfileInput) => {
      if (!user) throw new Error("Not authenticated");

      // If setting as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from("risk_profiles")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("risk_profiles")
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RiskProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["risk-profile-default"] });
      toast.success("Risk profile created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create risk profile: ${error.message}`);
    },
  });
}

// Update a risk profile
export function useUpdateRiskProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRiskProfileInput) => {
      if (!user) throw new Error("Not authenticated");

      const { id, ...updates } = input;

      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from("risk_profiles")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", id);
      }

      const { data, error } = await supabase
        .from("risk_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as RiskProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["risk-profile-default"] });
      toast.success("Risk profile updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update risk profile: ${error.message}`);
    },
  });
}

// Delete a risk profile
export function useDeleteRiskProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("risk_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-profiles"] });
      toast.success("Risk profile deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete risk profile: ${error.message}`);
    },
  });
}
