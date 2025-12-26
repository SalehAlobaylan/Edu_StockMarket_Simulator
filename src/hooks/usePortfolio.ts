import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Portfolio {
  id: string;
  user_id: string;
  name: string | null;
  cash_balance: number;
  initial_capital: number;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  ticker: string;
  type: string;
  quantity: number;
  price: number;
  value: number;
  commission: number | null;
  created_at: string;
}

// Fetch user's portfolio
export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as Portfolio | null;
    },
  });
}

// Fetch holdings for a portfolio
export function useHoldings(portfolioId: string | null) {
  return useQuery({
    queryKey: ["holdings", portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Holding[];
    },
    enabled: !!portfolioId,
  });
}

// Fetch transactions for a portfolio
export function useTransactions(portfolioId: string | null) {
  return useQuery({
    queryKey: ["transactions", portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!portfolioId,
  });
}

export interface TradeInput {
  portfolioId: string;
  ticker: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  commission?: number;
}

// Execute a trade
export function useExecuteTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TradeInput) => {
      const value = input.quantity * input.price;
      const commission = input.commission ?? value * 0.001; // 0.1% default commission

      // 1. Record the transaction
      const { error: txError } = await supabase.from("transactions").insert({
        portfolio_id: input.portfolioId,
        ticker: input.ticker,
        type: input.type,
        quantity: input.quantity,
        price: input.price,
        value,
        commission,
      });

      if (txError) throw txError;

      // 2. Update holdings
      const { data: existingHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("portfolio_id", input.portfolioId)
        .eq("ticker", input.ticker)
        .maybeSingle();

      if (input.type === "BUY") {
        if (existingHolding) {
          // Update existing holding with new avg price
          const totalQty = existingHolding.quantity + input.quantity;
          const totalCost = existingHolding.quantity * existingHolding.avg_price + input.quantity * input.price;
          const newAvgPrice = totalCost / totalQty;

          const { error: updateError } = await supabase
            .from("holdings")
            .update({ quantity: totalQty, avg_price: newAvgPrice })
            .eq("id", existingHolding.id);

          if (updateError) throw updateError;
        } else {
          // Create new holding
          const { error: insertError } = await supabase.from("holdings").insert({
            portfolio_id: input.portfolioId,
            ticker: input.ticker,
            name: input.name,
            quantity: input.quantity,
            avg_price: input.price,
          });

          if (insertError) throw insertError;
        }
      } else {
        // SELL
        if (!existingHolding || existingHolding.quantity < input.quantity) {
          throw new Error("Insufficient holdings");
        }

        const newQty = existingHolding.quantity - input.quantity;
        if (newQty === 0) {
          // Delete holding if quantity is 0
          const { error: deleteError } = await supabase
            .from("holdings")
            .delete()
            .eq("id", existingHolding.id);

          if (deleteError) throw deleteError;
        } else {
          // Update holding quantity (avg price stays the same on sell)
          const { error: updateError } = await supabase
            .from("holdings")
            .update({ quantity: newQty })
            .eq("id", existingHolding.id);

          if (updateError) throw updateError;
        }
      }

      // 3. Update portfolio cash balance
      const { data: portfolio } = await supabase
        .from("portfolios")
        .select("cash_balance")
        .eq("id", input.portfolioId)
        .single();

      if (portfolio) {
        const cashChange = input.type === "BUY" ? -(value + commission) : value - commission;
        const newBalance = portfolio.cash_balance + cashChange;

        const { error: balanceError } = await supabase
          .from("portfolios")
          .update({ cash_balance: newBalance })
          .eq("id", input.portfolioId);

        if (balanceError) throw balanceError;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${variables.type === "BUY" ? "Bought" : "Sold"} ${variables.quantity} shares of ${variables.ticker}`);
    },
    onError: (error: Error) => {
      toast.error(`Trade failed: ${error.message}`);
    },
  });
}
