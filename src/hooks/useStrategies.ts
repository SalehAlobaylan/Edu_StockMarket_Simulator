import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  entry_logic: string;
  exit_logic: string;
  is_template: boolean | null;
  indicators_used: string[] | null;
  variables_used: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyInput {
  name: string;
  description?: string;
  entry_logic: string;
  exit_logic: string;
  is_template?: boolean;
}

export interface UpdateStrategyInput {
  id: string;
  name?: string;
  description?: string;
  entry_logic?: string;
  exit_logic?: string;
}

export function useStrategies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["strategies", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Strategy[];
    },
    enabled: !!user,
  });
}

export function useStrategy(id: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["strategy", id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Strategy | null;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateStrategy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateStrategyInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("strategies")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          entry_logic: input.entry_logic,
          exit_logic: input.exit_logic,
          is_template: input.is_template || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Strategy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast({
        title: "Strategy saved",
        description: "Your strategy has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error saving strategy",
        description: error.message,
      });
    },
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateStrategyInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("strategies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Strategy;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["strategy", data.id] });
      toast({
        title: "Strategy updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating strategy",
        description: error.message,
      });
    },
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("strategies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast({
        title: "Strategy deleted",
        description: "The strategy has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting strategy",
        description: error.message,
      });
    },
  });
}
