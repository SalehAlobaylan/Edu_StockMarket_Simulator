import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  currency: string | null;
  exchange: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Fetch all active assets
export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("is_active", true)
        .order("ticker", { ascending: true });

      if (error) throw error;
      return data as Asset[];
    },
  });
}

// Fetch a single asset by ticker
export function useAssetByTicker(ticker: string | null) {
  return useQuery({
    queryKey: ["asset", ticker],
    queryFn: async () => {
      if (!ticker) return null;

      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("ticker", ticker)
        .maybeSingle();

      if (error) throw error;
      return data as Asset | null;
    },
    enabled: !!ticker,
  });
}

// Fetch assets grouped by sector
export function useAssetsBySector() {
  return useQuery({
    queryKey: ["assets-by-sector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("is_active", true)
        .order("sector", { ascending: true });

      if (error) throw error;

      // Group by sector
      const grouped: Record<string, Asset[]> = {};
      (data as Asset[]).forEach((asset) => {
        const sector = asset.sector || "Other";
        if (!grouped[sector]) grouped[sector] = [];
        grouped[sector].push(asset);
      });

      return grouped;
    },
  });
}
