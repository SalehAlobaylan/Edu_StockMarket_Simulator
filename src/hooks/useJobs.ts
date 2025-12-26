import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Job {
  id: string;
  user_id: string;
  type: string;
  status: string | null;
  progress_pct: number | null;
  payload: Json | null;
  result_ref: string | null;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

// Fetch all jobs for current user
export function useJobs(type?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobs", user?.id, type],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user,
  });
}

// Fetch a single job by ID
export function useJob(id: string | null) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll while job is pending or running
      const job = query.state.data as Job | null;
      if (job && (job.status === "PENDING" || job.status === "RUNNING")) {
        return 2000; // Poll every 2 seconds
      }
      return false;
    },
  });
}

// Fetch active jobs (pending or running)
export function useActiveJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobs-active", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["PENDING", "RUNNING"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

// Cancel a job
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ 
          status: "CANCELLED",
          finished_at: new Date().toISOString(),
        })
        .eq("id", id)
        .in("status", ["PENDING", "RUNNING"]);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["jobs-active"] });
      toast.success("Job cancelled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel job: ${error.message}`);
    },
  });
}

// Create a job (usually called internally by simulation hooks)
export function useCreateJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { type: string; payload?: Json }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          type: input.type,
          status: "PENDING",
          payload: input.payload ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-active"] });
    },
  });
}

// Update job progress (usually called by edge functions)
export function useUpdateJobProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; progress_pct: number; status?: JobStatus }) => {
      const updates: Partial<Job> = {
        progress_pct: input.progress_pct,
      };

      if (input.status) {
        updates.status = input.status;
        if (input.status === "RUNNING" && !updates.started_at) {
          updates.started_at = new Date().toISOString();
        }
        if (["COMPLETED", "FAILED", "CANCELLED"].includes(input.status)) {
          updates.finished_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", input.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job", variables.id] });
    },
  });
}
