import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TradeModal } from "@/components/portfolio/TradeModal";
import { usePortfolio, useHoldings, useTransactions } from "@/hooks/usePortfolio";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock current prices (would come from market data API)
const getCurrentPrice = (ticker: string): number => {
  const prices: Record<string, number> = {
    "2222": 29.45,
    "1180": 78.90,
    "2010": 92.15,
    "7010": 41.30,
    "1010": 25.60,
    "2350": 12.80,
  };
  return prices[ticker] || 30;
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const Portfolio = () => {
  const { t, isRTL } = useLanguage();
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const { data: portfolio, isLoading: loadingPortfolio } = usePortfolio();
  const { data: holdings = [], isLoading: loadingHoldings } = useHoldings(portfolio?.id ?? null);
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions(portfolio?.id ?? null);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const holdingsWithPrices = holdings.map((h) => {
      const currentPrice = getCurrentPrice(h.ticker);
      const value = h.quantity * currentPrice;
      const cost = h.quantity * h.avg_price;
      const pnl = value - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      return { ...h, currentPrice, value, pnl, pnlPct };
    });

    const investedValue = holdingsWithPrices.reduce((sum, h) => sum + h.value, 0);
    const totalCost = holdingsWithPrices.reduce((sum, h) => sum + h.quantity * h.avg_price, 0);
    const cashBalance = portfolio?.cash_balance ?? 100000;
    const totalValue = investedValue + cashBalance;
    const totalReturn = investedValue - totalCost;
    const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const initialCapital = portfolio?.initial_capital ?? 100000;
    const overallPnl = totalValue - initialCapital;
    const overallPnlPct = initialCapital > 0 ? (overallPnl / initialCapital) * 100 : 0;

    return {
      totalValue,
      cashBalance,
      investedValue,
      totalReturn,
      totalReturnPct,
      overallPnl,
      overallPnlPct,
      holdings: holdingsWithPrices,
    };
  }, [holdings, portfolio]);

  // Allocation data for pie chart
  const allocationData = useMemo(() => {
    const data = portfolioMetrics.holdings.map((h, index) => ({
      name: h.name,
      value: h.value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
    if (portfolioMetrics.cashBalance > 0) {
      data.push({
        name: t("portfolio.cash"),
        value: portfolioMetrics.cashBalance,
        color: "hsl(var(--muted))",
      });
    }
    return data;
  }, [portfolioMetrics, t]);

  // Convert holdings for sell modal
  const holdingsForSell = portfolioMetrics.holdings.map((h) => ({
    ticker: h.ticker,
    name: h.name,
    quantity: h.quantity,
    currentPrice: h.currentPrice,
  }));

  const isLoading = loadingPortfolio || loadingHoldings;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">{t("portfolio.title")}</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Trade Modals */}
      <TradeModal 
        open={buyModalOpen} 
        onOpenChange={setBuyModalOpen} 
        type="buy" 
        portfolioId={portfolio?.id}
      />
      <TradeModal 
        open={sellModalOpen} 
        onOpenChange={setSellModalOpen} 
        type="sell" 
        holdings={holdingsForSell}
        portfolioId={portfolio?.id}
      />

      {/* Page Header */}
      <div className={cn(
        "mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        isRTL && "sm:flex-row-reverse"
      )}>
        <div className={cn(isRTL && "text-right")}>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
            {t("portfolio.title")}
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            {t("portfolio.subtitle")}
          </p>
        </div>
        <div className={cn("flex gap-2 w-full sm:w-auto", isRTL && "flex-row-reverse")}>
          <Button variant="outline" className="gap-2 border-2 flex-1 sm:flex-initial" onClick={() => setSellModalOpen(true)}>
            <ArrowDownRight className="h-4 w-4" />
            {t("portfolio.sell")}
          </Button>
          <Button className="gap-2 border-2 flex-1 sm:flex-initial" onClick={() => setBuyModalOpen(true)}>
            <ArrowUpRight className="h-4 w-4" />
            {t("portfolio.buy")}
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <div className="border-2 border-border bg-card p-3 md:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="text-xs uppercase tracking-wider truncate">{t("portfolio.currentValue")}</span>
          </div>
          <p className="text-lg md:text-2xl font-bold font-mono truncate">
            SAR {portfolioMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs md:text-sm">
            {portfolioMetrics.overallPnl >= 0 ? (
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-profit shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-loss shrink-0" />
            )}
            <span
              className={cn(
                "font-semibold truncate",
                portfolioMetrics.overallPnl >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {portfolioMetrics.overallPnlPct >= 0 && "+"}
              {portfolioMetrics.overallPnlPct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="border-2 border-border bg-card p-3 md:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span className="text-xs uppercase tracking-wider truncate">{t("portfolio.cash")}</span>
          </div>
          <p className="text-lg md:text-2xl font-bold font-mono truncate">
            SAR {portfolioMetrics.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground truncate">
            {isRTL ? "متاح للتداول" : "Available"}
          </p>
        </div>

        <div className="border-2 border-border bg-card p-3 md:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-xs uppercase tracking-wider truncate">{t("portfolio.invested")}</span>
          </div>
          <p className="text-lg md:text-2xl font-bold font-mono truncate">
            SAR {portfolioMetrics.investedValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground">
            {holdings.length} {isRTL ? "مراكز" : "positions"}
          </p>
        </div>

        <div className="border-2 border-border bg-card p-3 md:p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-xs uppercase tracking-wider truncate">{t("portfolio.totalGainLoss")}</span>
          </div>
          <p
            className={cn(
              "text-lg md:text-2xl font-bold font-mono truncate",
              portfolioMetrics.totalReturn >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {portfolioMetrics.totalReturnPct >= 0 && "+"}
            {portfolioMetrics.totalReturnPct.toFixed(1)}%
          </p>
          <p
            className={cn(
              "mt-2 text-xs md:text-sm font-semibold truncate",
              portfolioMetrics.totalReturnPct >= 0 ? "text-profit" : "text-loss"
            )}
          >
            SAR {Math.abs(portfolioMetrics.totalReturn).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Holdings Table */}
        <div className="lg:col-span-2 border-2 border-border bg-card">
          <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {t("portfolio.holdings")}
            </h3>
          </div>
          {portfolioMetrics.holdings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("portfolio.noHoldings")}</p>
              <p className="text-sm mt-1">{t("portfolio.startTrading")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/50">
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                      {t("portfolio.stock")}
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                      {t("portfolio.quantity")}
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                      {t("portfolio.avgPrice")}
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                      {t("portfolio.price")}
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                      {t("portfolio.value")}
                    </th>
                    <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                      {t("simulations.pnl")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {portfolioMetrics.holdings.map((holding) => (
                    <tr key={holding.ticker} className="hover:bg-muted/30">
                      <td className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            {holding.ticker}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {holding.name}
                          </span>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                        {holding.quantity}
                      </td>
                      <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                        {holding.avg_price.toFixed(2)}
                      </td>
                      <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                        {holding.currentPrice.toFixed(2)}
                      </td>
                      <td className={cn("px-4 py-3 font-mono text-sm font-semibold", isRTL ? "text-left" : "text-right")}>
                        {holding.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={cn("px-4 py-3", isRTL ? "text-left" : "text-right")}>
                        <div
                          className={cn(
                            "font-mono text-sm font-semibold",
                            holding.pnl >= 0 ? "text-profit" : "text-loss"
                          )}
                        >
                          {holding.pnl >= 0 && "+"}
                          {holding.pnl.toFixed(2)}
                        </div>
                        <div
                          className={cn(
                            "text-xs",
                            holding.pnlPct >= 0 ? "text-profit" : "text-loss"
                          )}
                        >
                          ({holding.pnlPct >= 0 && "+"}
                          {holding.pnlPct.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Allocation Chart */}
        <div className="border-2 border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
            {t("portfolio.allocation")}
          </h3>
          {allocationData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {isRTL ? "لا يوجد توزيع" : "No allocations"}
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "2px solid hsl(var(--border))",
                        borderRadius: 0,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [
                        `SAR ${value.toLocaleString()}`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {allocationData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {((item.value / portfolioMetrics.totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 border-2 border-border bg-card">
        <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            {t("portfolio.transactions")}
          </h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {t("portfolio.noTransactions")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                    {t("portfolio.date")}
                  </th>
                  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                    {t("portfolio.type")}
                  </th>
                  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                    {t("portfolio.stock")}
                  </th>
                  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                    {t("portfolio.quantity")}
                  </th>
                  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                    {t("portfolio.price")}
                  </th>
                  <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                    {t("portfolio.value")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30">
                    <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-right" : "text-left")}>
                      {new Date(tx.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                    </td>
                    <td className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-semibold border-2",
                          tx.type === "BUY"
                            ? "border-profit/30 bg-profit/10 text-profit"
                            : "border-loss/30 bg-loss/10 text-loss"
                        )}
                      >
                        {tx.type === "BUY" ? t("portfolio.buy") : t("portfolio.sell")}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 font-mono font-semibold text-sm", isRTL ? "text-right" : "text-left")}>
                      {tx.ticker}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                      {tx.quantity}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                      {tx.price.toFixed(2)}
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-sm font-semibold", isRTL ? "text-left" : "text-right")}>
                      {tx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Portfolio;
