import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketCandle {
  id: string;
  asset_id: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

// Fetch market candles from database
export function useMarketCandles(
  assetId: string | null,
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ["market-candles", assetId, startDate, endDate],
    queryFn: async () => {
      if (!assetId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from("market_candles")
        .select("*")
        .eq("asset_id", assetId)
        .gte("timestamp", startDate)
        .lte("timestamp", endDate)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data as MarketCandle[];
    },
    enabled: !!assetId && !!startDate && !!endDate,
  });
}

// Fetch market candles by ticker
export function useMarketCandlesByTicker(
  ticker: string | null,
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ["market-candles-ticker", ticker, startDate, endDate],
    queryFn: async () => {
      if (!ticker || !startDate || !endDate) return [];

      // First get the asset
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .select("id")
        .eq("ticker", ticker)
        .single();

      if (assetError || !asset) {
        console.error("Asset not found:", ticker);
        return [];
      }

      const { data, error } = await supabase
        .from("market_candles")
        .select("*")
        .eq("asset_id", asset.id)
        .gte("timestamp", startDate)
        .lte("timestamp", endDate)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      return data as MarketCandle[];
    },
    enabled: !!ticker && !!startDate && !!endDate,
  });
}

interface FetchMarketDataInput {
  ticker: string;
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
}

interface FetchMarketDataResult {
  candles: MarketCandle[];
  source: "cache" | "generated";
  count: number;
}

// Fetch market data from edge function (generates/fetches if not cached)
export function useFetchMarketData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FetchMarketDataInput): Promise<FetchMarketDataResult> => {
      const response = await supabase.functions.invoke("fetch-market-data", {
        body: input,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to fetch market data");
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ["market-candles-ticker", variables.ticker] 
      });
    },
  });
}

// Get latest price for an asset
export function useLatestPrice(ticker: string | null) {
  return useQuery({
    queryKey: ["latest-price", ticker],
    queryFn: async () => {
      if (!ticker) return null;

      // First get the asset
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .select("id")
        .eq("ticker", ticker)
        .single();

      if (assetError || !asset) return null;

      // Get the latest candle
      const { data, error } = await supabase
        .from("market_candles")
        .select("close, timestamp")
        .eq("asset_id", asset.id)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? { price: data.close, timestamp: data.timestamp } : null;
    },
    enabled: !!ticker,
  });
}
