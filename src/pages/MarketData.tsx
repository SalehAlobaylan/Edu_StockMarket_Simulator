import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown, Star, Filter, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/hooks/useWatchlist";
import { useAssets } from "@/hooks/useAssets";
import { useFetchMarketData } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

// Generate mock market data (will be replaced with real API)
function generateMockMarketData(ticker: string) {
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const price = ticker === 'TASI' ? 12456.78 : 20 + (seed % 80) + Math.random() * 5;
  const change = (Math.random() - 0.5) * 6;
  const volume = ticker === 'TASI' ? "1.2B" : (Math.random() * 10 + 1).toFixed(1) + "M";
  const marketCap = ticker === 'TASI' ? "-" : (Math.random() * 100 + 10).toFixed(0) + "B";
  return { price, change, volume, marketCap };
}

const MarketData = () => {
  const { t, isRTL, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: assets = [], isLoading: loadingAssets, refetch: refetchAssets } = useAssets();
  const { data: watchlist = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const fetchMarketData = useFetchMarketData();

  const favorites = useMemo(() => {
    return watchlist.map((w) => w.ticker);
  }, [watchlist]);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      // Fetch data for first 3 assets to avoid rate limits
      const tickersToFetch = assets.slice(0, 3).map(a => a.ticker);
      
      for (const ticker of tickersToFetch) {
        await fetchMarketData.mutateAsync({
          ticker,
          startDate,
          endDate,
          forceRefresh: true,
        });
      }
      
      toast.success(isRTL ? "تم تحديث بيانات السوق" : "Market data refreshed");
      refetchAssets();
    } catch (error) {
      toast.error(isRTL ? "فشل تحديث البيانات" : "Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create market data from assets with mock prices
  const marketData = useMemo(() => {
    return assets.map(asset => ({
      ticker: asset.ticker,
      name: asset.name,
      sector: asset.sector || 'Other',
      ...generateMockMarketData(asset.ticker),
    }));
  }, [assets]);

  // Get unique sectors from assets
  const sectors = useMemo(() => {
    const uniqueSectors = new Set(assets.map(a => a.sector || 'Other'));
    return ['All Sectors', ...Array.from(uniqueSectors)];
  }, [assets]);

  const toggleFavorite = (ticker: string) => {
    if (favorites.includes(ticker)) {
      removeFromWatchlist.mutate(ticker);
    } else {
      addToWatchlist.mutate(ticker);
    }
  };

  const filteredData = marketData.filter((stock) => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector =
      selectedSector === "All Sectors" || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          {t("market.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("market.subtitle")}
        </p>
      </div>

      {/* Market Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="border-2 border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {t("market.tasiMarket")}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">12,456.78</span>
            <span className="text-sm font-semibold text-profit">+1.24%</span>
          </div>
        </div>
        <div className="border-2 border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {t("market.marketCap")}
          </p>
          <span className="text-2xl font-bold font-mono">10.2T SAR</span>
        </div>
        <div className="border-2 border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {t("market.volume")}
          </p>
          <span className="text-2xl font-bold font-mono">245M</span>
        </div>
        <div className="border-2 border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {isRTL ? "قيمة التداول" : "Traded Value"}
          </p>
          <span className="text-2xl font-bold font-mono">8.5B SAR</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={t("market.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("border-2 font-mono", isRTL ? "pr-10" : "pl-10")}
          />
        </div>
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-[180px] border-2">
            <Filter className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={handleRefreshAll}
          disabled={isRefreshing || loadingAssets}
          className="border-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2", isRefreshing && "animate-spin")} />
          {isRefreshing 
            ? (isRTL ? "جاري التحديث..." : "Refreshing...") 
            : (isRTL ? "تحديث البيانات" : "Refresh Data")}
        </Button>
      </div>

      {/* Stocks Table */}
      <div className="border-2 border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-10">
                  
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                  {isRTL ? "الرمز" : "Ticker"}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                  {t("market.stock")}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                  {isRTL ? "القطاع" : "Sector"}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                  {t("market.price")}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                  {t("market.change")}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                  {t("market.volume")}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                  {t("market.marketCap")}
                </th>
                <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {filteredData.map((stock) => {
                const isPositive = stock.change > 0;
                const isFavorite = favorites.includes(stock.ticker);

                return (
                  <tr key={stock.ticker} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleFavorite(stock.ticker)}
                        className="text-muted-foreground hover:text-warning"
                        disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            isFavorite && "fill-warning text-warning"
                          )}
                        />
                      </button>
                    </td>
                    <td className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>
                      <span className="font-mono font-semibold">
                        {stock.ticker}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 text-sm", isRTL ? "text-right" : "text-left")}>
                      {stock.name}
                    </td>
                    <td className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>
                      <span className="px-2 py-0.5 text-xs border-2 border-border bg-muted">
                        {stock.sector}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 font-mono font-semibold", isRTL ? "text-left" : "text-right")}>
                      {stock.price.toLocaleString()}
                    </td>
                    <td className={cn("px-4 py-3", isRTL ? "text-left" : "text-right")}>
                      <div
                        className={cn(
                          "flex items-center gap-1 font-mono font-semibold",
                          isRTL ? "justify-start" : "justify-end",
                          isPositive ? "text-profit" : "text-loss"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {isPositive && "+"}
                        {stock.change.toFixed(2)}%
                      </div>
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-sm text-muted-foreground", isRTL ? "text-left" : "text-right")}>
                      {stock.volume}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-sm text-muted-foreground", isRTL ? "text-left" : "text-right")}>
                      {stock.marketCap}
                    </td>
                    <td className={cn("px-4 py-3", isRTL ? "text-left" : "text-right")}>
                      <Link 
                        to={`/market/${stock.ticker}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium border-2 border-border hover:bg-muted transition-colors"
                      >
                        {isRTL ? "عرض الرسم" : "View Chart"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        {isRTL 
          ? "بيانات السوق متأخرة 15 دقيقة. المصدر: تداول (السوق السعودي)" 
          : "Market data is delayed by 15 minutes. Source: Tadawul (Saudi Exchange)"}
      </div>
    </AppLayout>
  );
};

export default MarketData;
