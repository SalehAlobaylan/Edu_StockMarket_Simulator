import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarketCandle {
  asset_id: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// Map TASI tickers to Twelve Data symbols
function getTwelveDataSymbol(ticker: string): string {
  // TASI stocks on Tadawul use format: XXXX.SR (e.g., 2222.SR for Aramco)
  const tadawulMap: Record<string, string> = {
    "TASI": "TASI",
    "2222": "2222.SR",  // Saudi Aramco
    "1180": "1180.SR",  // Al Rajhi Bank
    "1010": "1010.SR",  // Riyad Bank
    "2010": "2010.SR",  // SABIC
    "7010": "7010.SR",  // STC
    "2350": "2350.SR",  // Saudi Kayan
    "4001": "4001.SR",  // Abdullah Al Othaim
    "1211": "1211.SR",  // Ma'aden
    "4003": "4003.SR",  // Extra
  };
  return tadawulMap[ticker] || `${ticker}.SR`;
}

// Fetch data from Twelve Data API
async function fetchTwelveData(
  ticker: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<TwelveDataCandle[] | null> {
  const symbol = getTwelveDataSymbol(ticker);
  
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1day");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("format", "JSON");
  url.searchParams.set("timezone", "Asia/Riyadh");

  console.log(`Fetching from Twelve Data: ${symbol}`);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "error") {
      console.error("Twelve Data API error:", data.message);
      return null;
    }

    if (!data.values || !Array.isArray(data.values)) {
      console.log("No data returned from Twelve Data API");
      return null;
    }

    console.log(`Received ${data.values.length} candles from Twelve Data`);
    return data.values;
  } catch (error) {
    console.error("Error fetching from Twelve Data:", error);
    return null;
  }
}

// Generate mock market data as fallback
function generateMockCandles(
  assetId: string,
  ticker: string,
  startDate: string,
  endDate: string
): MarketCandle[] {
  const candles: MarketCandle[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const basePrices: Record<string, number> = {
    "TASI": 11500,
    "2222": 28.5,
    "1180": 85,
    "2010": 95,
    "7010": 42,
    "1010": 28,
    "2350": 12,
    "4001": 105,
    "1211": 48,
    "4003": 95,
  };
  
  let price = basePrices[ticker] || 100;
  const volatility = ticker === "TASI" ? 0.008 : 0.015;
  
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      const dailyReturn = (Math.random() - 0.5) * volatility * 2;
      const open = price;
      const close = price * (1 + dailyReturn);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(1000000 + Math.random() * 5000000);
      
      candles.push({
        asset_id: assetId,
        timestamp: current.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
      });
      
      price = close;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return candles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twelveDataApiKey = Deno.env.get("TWELVE_DATA_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ticker, startDate, endDate, forceRefresh = false } = await req.json();

    console.log(`Fetching market data for ${ticker} from ${startDate} to ${endDate}`);

    // Get asset by ticker
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, ticker, name")
      .eq("ticker", ticker)
      .single();

    if (assetError || !asset) {
      console.error("Asset not found:", ticker);
      return new Response(
        JSON.stringify({ error: `Asset not found: ${ticker}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we already have data for this date range
    if (!forceRefresh) {
      const { data: existingData, error: queryError } = await supabase
        .from("market_candles")
        .select("*")
        .eq("asset_id", asset.id)
        .gte("timestamp", startDate)
        .lte("timestamp", endDate)
        .order("timestamp", { ascending: true });

      if (!queryError && existingData && existingData.length > 0) {
        console.log(`Found ${existingData.length} existing candles for ${ticker}`);
        return new Response(
          JSON.stringify({ 
            candles: existingData,
            source: "cache",
            count: existingData.length 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let candles: MarketCandle[] = [];
    let source = "mock";

    // Try Twelve Data API if key is available
    if (twelveDataApiKey) {
      const apiData = await fetchTwelveData(ticker, startDate, endDate, twelveDataApiKey);
      
      if (apiData && apiData.length > 0) {
        // Convert Twelve Data format to our format
        candles = apiData.map((candle) => ({
          asset_id: asset.id,
          timestamp: candle.datetime.split(' ')[0], // Extract date part
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          volume: parseInt(candle.volume) || 0,
        }));
        source = "twelvedata";
        console.log(`Processed ${candles.length} candles from Twelve Data`);
      }
    }

    // Fallback to mock data if API fails or no key
    if (candles.length === 0) {
      console.log(`Generating mock data for ${ticker} (API unavailable or no key)`);
      candles = generateMockCandles(asset.id, ticker, startDate, endDate);
      source = "mock";
    }

    if (candles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data available for the specified date range" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert candles into database
    const { error: upsertError } = await supabase
      .from("market_candles")
      .upsert(candles, { 
        onConflict: "asset_id,timestamp",
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error("Error upserting candles:", upsertError);
    }

    console.log(`Successfully processed ${candles.length} candles for ${ticker} (source: ${source})`);

    return new Response(
      JSON.stringify({ 
        candles,
        source,
        count: candles.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-market-data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
