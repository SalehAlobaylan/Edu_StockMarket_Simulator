import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useMemo } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";

// Generate mock price data for now (will be replaced with real API)
function generateMockPrice(ticker: string) {
  // Seed random based on ticker for consistency
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const price = 20 + (seed % 80) + Math.random() * 5;
  const change = (Math.random() - 0.5) * 6;
  const volume = (Math.random() * 10 + 1).toFixed(1) + "M";
  return { price, change, volume };
}

export function MarketTicker() {
  const { data: assets = [], isLoading } = useAssets();

  // Generate mock prices for assets
  const stocksWithPrices = useMemo(() => {
    return assets
      .filter(a => a.sector !== 'Index') // Exclude index
      .slice(0, 5) // Show top 5
      .map(asset => ({
        ...asset,
        ...generateMockPrice(asset.ticker),
      }));
  }, [assets]);

  if (isLoading) {
    return (
      <GlassPanel className="p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="rounded-3xl p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-card/40 backdrop-blur-md">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <span className="live-indicator" />
          Live Executions
        </h3>
      </div>
      <div className="divide-y divide-border/20">
        {stocksWithPrices.map((stock) => {
          const isPositive = stock.change > 0;
          return (
            <div
              key={stock.ticker}
              className="flex items-center justify-between p-3 hover:bg-foreground/5 transition-colors cursor-pointer group border border-transparent hover:border-border/30 rounded-xl mx-2 my-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground border border-border/50">
                  {stock.ticker.slice(0, 4)}
                </div>
                <div>
                  <p className={cn(
                    "text-xs font-bold text-foreground transition-colors",
                    isPositive ? "group-hover:text-primary" : "group-hover:text-secondary"
                  )}>
                    {stock.price.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{stock.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-xs font-bold font-mono",
                  isPositive ? "text-profit" : "text-secondary"
                )}>
                  {isPositive ? "+" : ""}{(stock.change * 100).toFixed(0)}
                </p>
                <p className="text-[10px] text-muted-foreground">{stock.volume}</p>
              </div>
            </div>
          );
        })}
      </div>
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
    </GlassPanel>
  );
}
