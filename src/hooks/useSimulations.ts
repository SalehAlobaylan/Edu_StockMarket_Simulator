import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Simulation {
  id: string;
  user_id: string;
  name: string;
  ticker: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  commission_pct: number | null;
  slippage_bps: number | null;
  max_position_pct: number | null;
  strategy_id: string | null;
  status: string;
  total_return_pct: number | null;
  sharpe_ratio: number | null;
  max_drawdown_pct: number | null;
  win_rate_pct: number | null;
  cagr_pct: number | null;
  num_trades: number | null;
  result_data: SimulationResultData | null;
  created_at: string;
  completed_at: string | null;
}

// Using a more flexible type to match Supabase Json type
export interface SimulationResultData {
  dates?: string[];
  equity?: number[];
  trades?: Array<{
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    value: number;
    commission: number;
    pnl?: number;
    exitReason?: 'signal' | 'stop_loss' | 'take_profit' | 'trailing_stop';
  }>;
  metrics?: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    cagr: number;
    numTrades: number;
    stopLossHits?: number;
    takeProfitHits?: number;
    trailingStopHits?: number;
  };
}

// Type assertion helper
function parseSimulation(data: unknown): Simulation {
  const sim = data as Record<string, unknown>;
  return {
    ...sim,
    result_data: sim.result_data as SimulationResultData | null,
  } as Simulation;
}

function parseSimulations(data: unknown[]): Simulation[] {
  return data.map(parseSimulation);
}

export interface RunSimulationInput {
  name?: string;
  ticker: string;
  startDate: string;
  endDate: string;
  initialCapital?: number;
  commissionPct?: number;
  slippageBps?: number;
  maxPositionPct?: number;
  stopLossPct?: number | null;
  takeProfitPct?: number | null;
  trailingStopPct?: number | null;
  strategyId?: string;
  entryLogic?: string;
  exitLogic?: string;
}

// Fetch all simulations for the current user
export function useSimulations() {
  return useQuery({
    queryKey: ["simulations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return parseSimulations(data as unknown[]);
    },
  });
}

// Fetch a single simulation by ID
export function useSimulation(id: string | null) {
  return useQuery({
    queryKey: ["simulation", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("simulations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return parseSimulation(data as unknown);
    },
    enabled: !!id,
  });
}

// Run a new simulation
export function useRunSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RunSimulationInput) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("You must be logged in to run simulations");
      }

      const response = await supabase.functions.invoke("run-simulation", {
        body: input,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to run simulation");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      toast.success("Simulation completed successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Simulation failed: ${error.message}`);
    },
  });
}

// Delete a simulation
export function useDeleteSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simulations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      toast.success("Simulation deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

// Fetch simulations for comparison
export function useSimulationsForComparison(ids: string[]) {
  return useQuery({
    queryKey: ["simulations-compare", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      
      const { data, error } = await supabase
        .from("simulations")
        .select("*")
        .in("id", ids);

      if (error) throw error;
      return parseSimulations(data as unknown[]);
    },
    enabled: ids.length > 0,
  });
}
