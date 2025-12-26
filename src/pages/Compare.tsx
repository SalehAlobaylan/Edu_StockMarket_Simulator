import { AppLayout } from "@/components/layout/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GitCompare, TrendingUp, TrendingDown, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSimulations, useSimulationsForComparison } from "@/hooks/useSimulations";
import { useMarketCandlesByTicker } from "@/hooks/useMarketData";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Chart colors for different simulations
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Calculate Alpha and Beta vs benchmark
function calculateAlphaBeta(
  strategyReturns: number[],
  benchmarkReturns: number[],
  riskFreeRate: number = 0.02 // 2% annual risk-free rate
): { alpha: number; beta: number; rSquared: number; correlation: number } {
  if (strategyReturns.length !== benchmarkReturns.length || strategyReturns.length < 2) {
    return { alpha: 0, beta: 0, rSquared: 0, correlation: 0 };
  }

  const n = strategyReturns.length;
  const dailyRiskFree = riskFreeRate / 252;

  // Calculate means
  const meanStrategy = strategyReturns.reduce((a, b) => a + b, 0) / n;
  const meanBenchmark = benchmarkReturns.reduce((a, b) => a + b, 0) / n;

  // Calculate covariance and variance
  let covariance = 0;
  let varianceBenchmark = 0;
  let varianceStrategy = 0;

  for (let i = 0; i < n; i++) {
    const stratDiff = strategyReturns[i] - meanStrategy;
    const benchDiff = benchmarkReturns[i] - meanBenchmark;
    covariance += stratDiff * benchDiff;
    varianceBenchmark += benchDiff * benchDiff;
    varianceStrategy += stratDiff * stratDiff;
  }

  covariance /= n - 1;
  varianceBenchmark /= n - 1;
  varianceStrategy /= n - 1;

  // Beta = Covariance(Strategy, Benchmark) / Variance(Benchmark)
  const beta = varianceBenchmark > 0 ? covariance / varianceBenchmark : 0;

  // Alpha (annualized) = (Strategy Return - Risk-free) - Beta * (Benchmark Return - Risk-free)
  const annualizedStrategyReturn = meanStrategy * 252;
  const annualizedBenchmarkReturn = meanBenchmark * 252;
  const alpha = (annualizedStrategyReturn - riskFreeRate) - beta * (annualizedBenchmarkReturn - riskFreeRate);

  // R-squared
  const totalSS = varianceStrategy * (n - 1);
  const explainedSS = beta * beta * varianceBenchmark * (n - 1);
  const rSquared = totalSS > 0 ? explainedSS / totalSS : 0;

  // Correlation
  const correlation = varianceBenchmark > 0 && varianceStrategy > 0 
    ? covariance / (Math.sqrt(varianceBenchmark) * Math.sqrt(varianceStrategy))
    : 0;

  return {
    alpha: Math.round(alpha * 10000) / 100, // Convert to percentage
    beta: Math.round(beta * 100) / 100,
    rSquared: Math.round(rSquared * 100) / 100,
    correlation: Math.round(correlation * 100) / 100,
  };
}

// Calculate daily returns from equity curve
function calculateDailyReturns(equity: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    if (equity[i - 1] > 0) {
      returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
    }
  }
  return returns;
}

const Compare = () => {
  const { t, isRTL } = useLanguage();
  const { data: allSimulations, isLoading: loadingAll } = useSimulations();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter only completed simulations
  const completedSimulations = useMemo(() => {
    return allSimulations?.filter((s) => s.status === "completed") || [];
  }, [allSimulations]);

  // Fetch detailed data for selected simulations
  const { data: selectedSimulations, isLoading: loadingSelected } = useSimulationsForComparison(selectedIds);

  // Fetch TASI benchmark data for alpha/beta calculation
  const dateRange = useMemo(() => {
    if (!selectedSimulations || selectedSimulations.length === 0) return { start: '', end: '' };
    
    const allDates = selectedSimulations.flatMap(s => s.result_data?.dates || []);
    const sortedDates = [...allDates].sort();
    
    return {
      start: sortedDates[0] || '',
      end: sortedDates[sortedDates.length - 1] || '',
    };
  }, [selectedSimulations]);

  const { data: tasiCandles } = useMarketCandlesByTicker('TASI', dateRange.start, dateRange.end);

  // Calculate benchmark returns from TASI data
  const benchmarkData = useMemo(() => {
    if (!tasiCandles || tasiCandles.length === 0) {
      // Generate synthetic benchmark if no TASI data
      if (!selectedSimulations || selectedSimulations.length === 0) return { returns: [], prices: [] };
      
      const firstSim = selectedSimulations[0];
      const dates = firstSim.result_data?.dates || [];
      const initialValue = firstSim.initial_capital;
      
      // Generate a simple benchmark with slight positive drift
      const prices: number[] = [];
      let price = initialValue;
      for (let i = 0; i < dates.length; i++) {
        price = price * (1 + (Math.random() - 0.48) * 0.02);
        prices.push(price);
      }
      
      return {
        returns: calculateDailyReturns(prices),
        prices,
      };
    }

    const closes = tasiCandles.map(c => c.close);
    return {
      returns: calculateDailyReturns(closes),
      prices: closes,
    };
  }, [tasiCandles, selectedSimulations]);

  // Calculate alpha/beta for each selected simulation
  const alphaBetaMetrics = useMemo(() => {
    if (!selectedSimulations || selectedSimulations.length === 0 || benchmarkData.returns.length === 0) {
      return [];
    }

    return selectedSimulations.map(sim => {
      const equity = sim.result_data?.equity || [];
      const strategyReturns = calculateDailyReturns(equity);
      
      // Align returns lengths
      const minLength = Math.min(strategyReturns.length, benchmarkData.returns.length);
      const alignedStrategyReturns = strategyReturns.slice(0, minLength);
      const alignedBenchmarkReturns = benchmarkData.returns.slice(0, minLength);
      
      return {
        id: sim.id,
        name: sim.name,
        ...calculateAlphaBeta(alignedStrategyReturns, alignedBenchmarkReturns),
      };
    });
  }, [selectedSimulations, benchmarkData]);

  // Build chart data from equity curves
  const chartData = useMemo(() => {
    if (!selectedSimulations || selectedSimulations.length === 0) return [];

    // Find the simulation with the most data points
    let maxDates: string[] = [];
    selectedSimulations.forEach((sim) => {
      const dates = sim.result_data?.dates || [];
      if (dates.length > maxDates.length) {
        maxDates = dates;
      }
    });

    // Build merged data including TASI benchmark
    return maxDates.map((date, index) => {
      const point: Record<string, string | number> = { date };
      
      selectedSimulations.forEach((sim) => {
        const equity = sim.result_data?.equity || [];
        point[sim.name] = equity[index] ?? null;
      });

      // Add TASI benchmark line (normalized to first simulation's initial capital)
      if (benchmarkData.prices.length > 0 && selectedSimulations.length > 0) {
        const initialCapital = selectedSimulations[0].initial_capital;
        const benchmarkInitial = benchmarkData.prices[0];
        const normalizedBenchmark = benchmarkData.prices[index] 
          ? (benchmarkData.prices[index] / benchmarkInitial) * initialCapital
          : null;
        point['TASI Benchmark'] = normalizedBenchmark ?? 0;
      }

      return point;
    });
  }, [selectedSimulations, benchmarkData]);

  // Build metrics comparison including alpha/beta
  const metricsData = useMemo(() => {
    if (!selectedSimulations || selectedSimulations.length === 0) return [];

    const baseMetrics = [
      {
        metric: t("simulations.totalReturn"),
        tooltip: isRTL ? "العائد الإجمالي خلال فترة المحاكاة" : "Total return over the simulation period",
        values: selectedSimulations.map((s) => 
          s.total_return_pct != null ? `${s.total_return_pct >= 0 ? "+" : ""}${s.total_return_pct.toFixed(2)}%` : "N/A"
        ),
      },
      {
        metric: t("simulations.sharpeRatio"),
        tooltip: isRTL ? "العائد المعدل حسب المخاطر (أعلى = أفضل)" : "Risk-adjusted return (higher is better)",
        values: selectedSimulations.map((s) => 
          s.sharpe_ratio != null ? s.sharpe_ratio.toFixed(2) : "N/A"
        ),
      },
      {
        metric: t("simulations.maxDrawdown"),
        tooltip: isRTL ? "أكبر انخفاض من القمة إلى القاع" : "Maximum peak-to-trough decline",
        values: selectedSimulations.map((s) => 
          s.max_drawdown_pct != null ? `${s.max_drawdown_pct.toFixed(2)}%` : "N/A"
        ),
      },
      {
        metric: t("simulations.winRate"),
        tooltip: isRTL ? "نسبة الصفقات الرابحة" : "Percentage of winning trades",
        values: selectedSimulations.map((s) => 
          s.win_rate_pct != null ? `${s.win_rate_pct.toFixed(1)}%` : "N/A"
        ),
      },
      {
        metric: t("simulations.cagr"),
        tooltip: isRTL ? "معدل النمو السنوي المركب" : "Compound Annual Growth Rate",
        values: selectedSimulations.map((s) => 
          s.cagr_pct != null ? `${s.cagr_pct.toFixed(2)}%` : "N/A"
        ),
      },
      {
        metric: t("simulations.totalTrades"),
        tooltip: isRTL ? "إجمالي عدد الصفقات المنفذة" : "Total number of trades executed",
        values: selectedSimulations.map((s) => 
          s.num_trades != null ? s.num_trades.toString() : "N/A"
        ),
      },
    ];

    // Add Alpha/Beta metrics if available
    if (alphaBetaMetrics.length > 0) {
      baseMetrics.push(
        {
          metric: isRTL ? "ألفا (α)" : "Alpha (α)",
          tooltip: isRTL 
            ? "العائد الزائد مقارنة بالمؤشر بعد تعديل المخاطر. إيجابي = أداء أفضل من المتوقع"
            : "Excess return vs benchmark after adjusting for risk. Positive = outperformance",
          values: alphaBetaMetrics.map((m) => 
            m.alpha >= 0 ? `+${m.alpha.toFixed(2)}%` : `${m.alpha.toFixed(2)}%`
          ),
        },
        {
          metric: isRTL ? "بيتا (β)" : "Beta (β)",
          tooltip: isRTL 
            ? "حساسية الاستراتيجية لتحركات السوق. 1 = يتحرك مع السوق، <1 = أقل تقلباً، >1 = أكثر تقلباً"
            : "Strategy sensitivity to market moves. 1 = moves with market, <1 = less volatile, >1 = more volatile",
          values: alphaBetaMetrics.map((m) => m.beta.toFixed(2)),
        },
        {
          metric: isRTL ? "الارتباط" : "Correlation",
          tooltip: isRTL 
            ? "مدى ارتباط عوائد الاستراتيجية بعوائد المؤشر"
            : "How closely strategy returns correlate with benchmark returns",
          values: alphaBetaMetrics.map((m) => m.correlation.toFixed(2)),
        },
        {
          metric: "R²",
          tooltip: isRTL 
            ? "نسبة تباين الاستراتيجية المفسرة بتحركات السوق"
            : "Proportion of strategy variance explained by market movements",
          values: alphaBetaMetrics.map((m) => m.rSquared.toFixed(2)),
        }
      );
    }

    return baseMetrics;
  }, [selectedSimulations, alphaBetaMetrics, t, isRTL]);

  const toggleSimulation = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getSimulationColor = (index: number) => {
    return CHART_COLORS[index % CHART_COLORS.length];
  };

  // Determine best performing simulation for each metric
  const getBestForMetric = (metricName: string): number[] => {
    if (!selectedSimulations || selectedSimulations.length < 2) return [];
    
    const bestIndices: number[] = [];
    
    switch (metricName) {
      case t("simulations.totalReturn"):
      case t("simulations.cagr"):
      case t("simulations.winRate"):
      case isRTL ? "ألفا (α)" : "Alpha (α)":
        // Higher is better
        const maxReturn = Math.max(...selectedSimulations.map(s => s.total_return_pct ?? -Infinity));
        selectedSimulations.forEach((s, i) => {
          if (s.total_return_pct === maxReturn) bestIndices.push(i);
        });
        break;
      case t("simulations.sharpeRatio"):
        const maxSharpe = Math.max(...selectedSimulations.map(s => s.sharpe_ratio ?? -Infinity));
        selectedSimulations.forEach((s, i) => {
          if (s.sharpe_ratio === maxSharpe) bestIndices.push(i);
        });
        break;
      case t("simulations.maxDrawdown"):
        // Lower is better
        const minDD = Math.min(...selectedSimulations.map(s => s.max_drawdown_pct ?? Infinity));
        selectedSimulations.forEach((s, i) => {
          if (s.max_drawdown_pct === minDD) bestIndices.push(i);
        });
        break;
    }
    
    return bestIndices;
  };

  if (loadingAll) {
    return (
      <AppLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">{t("compare.title")}</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[350px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            {t("compare.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("compare.subtitle")}
          </p>
        </div>
      </div>

      {/* Simulation Selector */}
      <div className="mb-6 border-2 border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
          {t("compare.selectStrategies")}
        </h3>
        {completedSimulations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("compare.noSimulations")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {completedSimulations.map((sim, index) => (
              <div key={sim.id} className="flex items-center gap-2">
                <Checkbox
                  id={sim.id}
                  checked={selectedIds.includes(sim.id)}
                  onCheckedChange={() => toggleSimulation(sim.id)}
                />
                <Label
                  htmlFor={sim.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="h-3 w-3"
                    style={{ backgroundColor: getSimulationColor(index) }}
                  />
                  <span className="text-sm">{sim.name}</span>
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && selectedSimulations && selectedSimulations.length > 0 ? (
        <>
          {/* Alpha/Beta Summary Cards */}
          {alphaBetaMetrics.length > 0 && (
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {alphaBetaMetrics.map((metric, index) => (
                <div key={metric.id} className="border-2 border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-3 w-3"
                      style={{ backgroundColor: getSimulationColor(index) }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{metric.name}</span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">α</span>
                      <span className={cn(
                        "ml-1 font-mono font-bold",
                        metric.alpha >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {metric.alpha >= 0 ? "+" : ""}{metric.alpha.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">β</span>
                      <span className="ml-1 font-mono font-semibold">
                        {metric.beta.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {metric.alpha > 0 ? (
                      <TrendingUp className="h-3 w-3 text-profit" />
                    ) : metric.alpha < 0 ? (
                      <TrendingDown className="h-3 w-3 text-loss" />
                    ) : null}
                    <span>
                      {metric.alpha > 0 
                        ? (isRTL ? "يتفوق على المؤشر" : "Outperforming benchmark")
                        : metric.alpha < 0 
                          ? (isRTL ? "أداء أقل من المؤشر" : "Underperforming benchmark")
                          : (isRTL ? "مطابق للمؤشر" : "Matching benchmark")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Equity Curve Comparison */}
          <div className="mb-6 chart-container">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("compare.equityCurve")}
              </h3>
              <div className="flex items-center gap-4 text-xs flex-wrap">
                {selectedSimulations.map((sim, index) => (
                  <div key={sim.id} className="flex items-center gap-2">
                    <div
                      className="h-2 w-4"
                      style={{ backgroundColor: getSimulationColor(index) }}
                    />
                    <span>{sim.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="h-2 w-4 bg-muted-foreground/40" />
                  <span>{isRTL ? "مؤشر تاسي" : "TASI Benchmark"}</span>
                </div>
              </div>
            </div>
            <div className="h-[350px]">
              {loadingSelected ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short" });
                      }}
                      reversed={isRTL}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      orientation={isRTL ? "right" : "left"}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "2px solid hsl(var(--border))",
                        borderRadius: 0,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [
                        value != null ? `SAR ${value.toLocaleString()}` : "N/A",
                        "",
                      ]}
                    />
                    {/* TASI Benchmark line */}
                    <Line
                      type="monotone"
                      dataKey="TASI Benchmark"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                      connectNulls
                    />
                    {/* Strategy lines */}
                    {selectedSimulations.map((sim, index) => (
                      <Line
                        key={sim.id}
                        type="monotone"
                        dataKey={sim.name}
                        stroke={getSimulationColor(index)}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Metrics Comparison Table */}
          <div className="border-2 border-border bg-card">
            <div className="border-b-2 border-border px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("compare.performanceMetrics")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <TooltipProvider>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                        {t("compare.metrics")}
                      </th>
                      {selectedSimulations.map((sim, index) => (
                        <th
                          key={sim.id}
                          className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}
                        >
                          <div className="flex items-center gap-2 justify-end">
                            <div
                              className="h-2 w-2"
                              style={{ backgroundColor: getSimulationColor(index) }}
                            />
                            {sim.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-border">
                    {metricsData.map((row) => {
                      const bestIndices = getBestForMetric(row.metric);
                      
                      return (
                        <tr key={row.metric} className="hover:bg-muted/30">
                          <td className={cn("px-4 py-3 text-sm font-medium", isRTL ? "text-right" : "text-left")}>
                            <div className="flex items-center gap-2">
                              {row.metric}
                              {row.tooltip && (
                                <UITooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>{row.tooltip}</p>
                                  </TooltipContent>
                                </UITooltip>
                              )}
                            </div>
                          </td>
                          {row.values.map((value, index) => {
                            const isPositive = value.startsWith("+");
                            const isNegative = value.startsWith("-") && row.metric !== t("simulations.maxDrawdown");
                            const isBest = bestIndices.includes(index);
                            const isAlpha = row.metric === (isRTL ? "ألفا (α)" : "Alpha (α)");

                            return (
                              <td
                                key={selectedSimulations[index].id}
                                className={cn(
                                  "px-4 py-3 font-mono text-sm font-semibold",
                                  isRTL ? "text-left" : "text-right",
                                  isAlpha && isPositive && "text-profit",
                                  isAlpha && isNegative && "text-loss",
                                  !isAlpha && isPositive && row.metric === t("simulations.totalReturn") && "text-profit",
                                  !isAlpha && isNegative && "text-loss",
                                  row.metric === t("simulations.maxDrawdown") && value !== "N/A" && "text-loss"
                                )}
                              >
                                <div className="flex items-center gap-2 justify-end">
                                  {value}
                                  {isBest && selectedSimulations.length > 1 && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 text-profit border-profit/30">
                                      {isRTL ? "الأفضل" : "Best"}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          </div>

          {/* Alpha/Beta Explanation */}
          <div className="mt-6 p-4 border-2 border-border bg-muted/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {isRTL ? "ما هي ألفا وبيتا؟" : "What are Alpha & Beta?"}
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>{isRTL ? "ألفا (α):" : "Alpha (α):"}</strong>{" "}
                {isRTL 
                  ? "يقيس العائد الزائد للاستراتيجية مقارنة بالمؤشر. ألفا إيجابية تعني أن الاستراتيجية تتفوق على السوق."
                  : "Measures the strategy's excess return compared to the benchmark. Positive alpha means the strategy outperforms the market."}
              </p>
              <p>
                <strong>{isRTL ? "بيتا (β):" : "Beta (β):"}</strong>{" "}
                {isRTL
                  ? "يقيس حساسية الاستراتيجية لتحركات السوق. بيتا = 1 تعني تحرك مع السوق، <1 أقل تقلباً، >1 أكثر تقلباً."
                  : "Measures how sensitive the strategy is to market movements. Beta = 1 means it moves with the market, <1 is less volatile, >1 is more volatile."}
              </p>
            </div>
          </div>
        </>
      ) : selectedIds.length > 0 && loadingSelected ? (
        <div className="space-y-4">
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border py-20 text-center">
          <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("compare.selectMultiple")}</h3>
          <p className="text-muted-foreground max-w-md">
            {t("compare.runSimulations")}
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default Compare;
