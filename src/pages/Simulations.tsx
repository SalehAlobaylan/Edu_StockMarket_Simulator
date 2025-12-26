import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { MonthlyReturnsChart } from "@/components/charts/MonthlyReturnsChart";
import {
  Play,
  Settings,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Trash2,
  ChevronDown,
  Loader2,
  ShieldAlert,
  CircleDollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSimulations, useRunSimulation, useDeleteSimulation, Simulation } from "@/hooks/useSimulations";
import { useStrategies } from "@/hooks/useStrategies";
import { useAssets } from "@/hooks/useAssets";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";

const Simulations = () => {
  const { t, isRTL } = useLanguage();
  const { data: simulations, isLoading: simulationsLoading } = useSimulations();
  const { data: strategies } = useStrategies();
  const { data: assets = [] } = useAssets();
  const runSimulation = useRunSimulation();
  const deleteSimulation = useDeleteSimulation();

  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [ticker, setTicker] = useState("TASI");
  const [strategyId, setStrategyId] = useState<string>("");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [capital, setCapital] = useState("100000");
  const [commission, setCommission] = useState([0.1]);
  const [slippage, setSlippage] = useState([5]);
  const [maxPosition, setMaxPosition] = useState([10]);
  const [stopLoss, setStopLoss] = useState([5]);
  const [takeProfit, setTakeProfit] = useState([10]);
  const [trailingStop, setTrailingStop] = useState([0]);
  const [historyOpen, setHistoryOpen] = useState(true);

  // Select first simulation when data loads
  useEffect(() => {
    if (simulations && simulations.length > 0 && !selectedSimulation) {
      const completed = simulations.find(s => s.status === 'completed');
      if (completed) setSelectedSimulation(completed);
    }
  }, [simulations, selectedSimulation]);

  const handleRunSimulation = async () => {
    if (!strategyId) {
      toast.error("Please select a strategy first");
      return;
    }

    const selectedStrategy = strategies?.find(s => s.id === strategyId);
    
    await runSimulation.mutateAsync({
      name: `${selectedStrategy?.name || 'Strategy'} - ${ticker}`,
      ticker,
      startDate,
      endDate,
      initialCapital: parseFloat(capital),
      commissionPct: commission[0],
      slippageBps: slippage[0],
      maxPositionPct: maxPosition[0],
      stopLossPct: stopLoss[0] > 0 ? stopLoss[0] : null,
      takeProfitPct: takeProfit[0] > 0 ? takeProfit[0] : null,
      trailingStopPct: trailingStop[0] > 0 ? trailingStop[0] : null,
      strategyId,
    });
  };

  const handleDeleteSimulation = async (id: string) => {
    await deleteSimulation.mutateAsync(id);
    if (selectedSimulation?.id === id) {
      setSelectedSimulation(null);
    }
  };

  const resultData = selectedSimulation?.result_data;
  const trades = resultData?.trades || [];

  return (
    <AppLayout>
      {/* Page Header */}
      <div className={cn("mb-8", isRTL && "text-right")}>
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          {t("simulations.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("simulations.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Simulation Parameters */}
          <div className="border-2 border-border bg-card p-4 space-y-4">
            <h3 className={cn("text-sm font-semibold uppercase tracking-wider", isRTL && "text-right")}>
              {t("simulations.configuration")}
            </h3>

            <div className="space-y-2">
              <Label className={cn(isRTL && "text-right block")}>{t("simulations.strategy")}</Label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder={t("simulations.selectStrategy")} />
                </SelectTrigger>
                <SelectContent>
                  {strategies?.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={cn(isRTL && "text-right block")}>{t("simulations.asset")}</Label>
              <Select value={ticker} onValueChange={setTicker}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.ticker} value={asset.ticker}>
                      <span className="font-mono">{asset.ticker}</span> -{" "}
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className={cn(isRTL && "text-right block")}>{t("strategy.startDate")}</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-2" 
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(isRTL && "text-right block")}>{t("strategy.endDate")}</Label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-2" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={cn(isRTL && "text-right block")}>{t("simulations.initialCapital")}</Label>
              <Input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="border-2 font-mono"
              />
            </div>
          </div>

          {/* Execution Config */}
          <div className="border-2 border-border bg-card p-4 space-y-4">
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Settings className="h-4 w-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("simulations.execution")}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span>{t("simulations.commission")}</span>
                  <span className="font-mono">{commission[0]}%</span>
                </div>
                <Slider
                  value={commission}
                  onValueChange={setCommission}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div className="space-y-2">
                <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span>{t("simulations.slippage")}</span>
                  <span className="font-mono">{slippage[0]} bps</span>
                </div>
                <Slider
                  value={slippage}
                  onValueChange={setSlippage}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span>{t("simulations.maxPosition")}</span>
                  <span className="font-mono">{maxPosition[0]}%</span>
                </div>
                <Slider
                  value={maxPosition}
                  onValueChange={setMaxPosition}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="border-2 border-border bg-card p-4 space-y-4">
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <ShieldAlert className="h-4 w-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("simulations.riskManagement")}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                    <TrendingDown className="h-3 w-3 text-loss" />
                    {t("simulations.stopLoss")}
                  </span>
                  <span className="font-mono text-loss">-{stopLoss[0]}%</span>
                </div>
                <Slider
                  value={stopLoss}
                  onValueChange={setStopLoss}
                  min={0}
                  max={25}
                  step={0.5}
                />
                <p className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                  {stopLoss[0] === 0 ? t("simulations.disabled") : `${t("simulations.exitIfLoss")} ${stopLoss[0]}%`}
                </p>
              </div>

              <div className="space-y-2">
                <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                    <CircleDollarSign className="h-3 w-3 text-profit" />
                    {t("simulations.takeProfit")}
                  </span>
                  <span className="font-mono text-profit">+{takeProfit[0]}%</span>
                </div>
                <Slider
                  value={takeProfit}
                  onValueChange={setTakeProfit}
                  min={0}
                  max={50}
                  step={1}
                />
                <p className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                  {takeProfit[0] === 0 ? t("simulations.disabled") : `${t("simulations.exitIfProfit")} ${takeProfit[0]}%`}
                </p>
              </div>

              <div className="space-y-2">
                <div className={cn("flex justify-between text-sm", isRTL && "flex-row-reverse")}>
                  <span className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                    <Activity className="h-3 w-3 text-warning" />
                    {t("simulations.trailingStop")}
                  </span>
                  <span className="font-mono text-warning">{trailingStop[0]}%</span>
                </div>
                <Slider
                  value={trailingStop}
                  onValueChange={setTrailingStop}
                  min={0}
                  max={25}
                  step={0.5}
                />
                <p className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>
                  {trailingStop[0] === 0 ? t("simulations.disabled") : `${t("simulations.trailBelow")} ${trailingStop[0]}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Run Button */}
          <Button
            onClick={handleRunSimulation}
            className="w-full gap-2 border-2 h-12"
            disabled={runSimulation.isPending || !strategyId}
          >
            {runSimulation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {runSimulation.isPending ? t("simulations.running") : t("simulations.runSimulation")}
          </Button>

          {/* Simulation History */}
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <div className="border-2 border-border bg-card">
              <CollapsibleTrigger className={cn(
                "flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30",
                isRTL && "flex-row-reverse"
              )}>
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  {t("simulations.history")} ({simulations?.length || 0})
                </h3>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  historyOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t-2 border-border max-h-64 overflow-y-auto">
                  {simulationsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : simulations?.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {t("simulations.noSimulations")}
                    </div>
                  ) : (
                    simulations?.map((sim) => (
                      <div
                        key={sim.id}
                        className={cn(
                          "flex items-center justify-between px-4 py-2 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30",
                          selectedSimulation?.id === sim.id && "bg-muted/50",
                          isRTL && "flex-row-reverse"
                        )}
                        onClick={() => setSelectedSimulation(sim)}
                      >
                        <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                          <p className="text-sm font-medium truncate">{sim.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sim.ticker} • {new Date(sim.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                          {sim.status === 'completed' && sim.total_return_pct !== null && (
                            <span className={cn(
                              "text-xs font-mono font-semibold",
                              sim.total_return_pct >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {sim.total_return_pct >= 0 && "+"}{sim.total_return_pct.toFixed(1)}%
                            </span>
                          )}
                          {sim.status === 'running' && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSimulation(sim.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* Main Content - Results */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSimulation && selectedSimulation.status === 'completed' ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-2 border-border bg-card p-4">
                  <div className={cn("flex items-center gap-2 text-muted-foreground mb-2", isRTL && "flex-row-reverse")}>
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t("simulations.totalReturn")}</span>
                  </div>
                  <p className={cn(
                    "metric-value",
                    (selectedSimulation.total_return_pct || 0) >= 0 ? "text-profit" : "text-loss",
                    isRTL && "text-right"
                  )}>
                    {(selectedSimulation.total_return_pct || 0) >= 0 && "+"}
                    {selectedSimulation.total_return_pct?.toFixed(2)}%
                  </p>
                </div>
                <div className="border-2 border-border bg-card p-4">
                  <div className={cn("flex items-center gap-2 text-muted-foreground mb-2", isRTL && "flex-row-reverse")}>
                    <Target className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t("simulations.sharpeRatio")}</span>
                  </div>
                  <p className={cn("metric-value", isRTL && "text-right")}>{selectedSimulation.sharpe_ratio?.toFixed(2)}</p>
                </div>
                <div className="border-2 border-border bg-card p-4">
                  <div className={cn("flex items-center gap-2 text-muted-foreground mb-2", isRTL && "flex-row-reverse")}>
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t("simulations.maxDrawdown")}</span>
                  </div>
                  <p className={cn("metric-value text-loss", isRTL && "text-right")}>
                    -{selectedSimulation.max_drawdown_pct?.toFixed(2)}%
                  </p>
                </div>
                <div className="border-2 border-border bg-card p-4">
                  <div className={cn("flex items-center gap-2 text-muted-foreground mb-2", isRTL && "flex-row-reverse")}>
                    <Activity className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">{t("simulations.winRate")}</span>
                  </div>
                  <p className={cn("metric-value", isRTL && "text-right")}>{selectedSimulation.win_rate_pct?.toFixed(1)}%</p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t("simulations.cagr"), value: `${selectedSimulation.cagr_pct?.toFixed(2)}%` },
                  { label: t("simulations.totalTrades"), value: selectedSimulation.num_trades?.toString() || "0" },
                  { label: t("simulations.winningTrades"), value: trades.filter(t => t.type === 'SELL' && (t.pnl || 0) > 0).length.toString() },
                  { label: t("simulations.losingTrades"), value: trades.filter(t => t.type === 'SELL' && (t.pnl || 0) <= 0).length.toString() },
                  { label: t("simulations.stopLossExits"), value: resultData?.metrics?.stopLossHits?.toString() || "0", highlight: "loss" },
                  { label: t("simulations.takeProfitExits"), value: resultData?.metrics?.takeProfitHits?.toString() || "0", highlight: "profit" },
                  { label: t("simulations.trailingStopExits"), value: resultData?.metrics?.trailingStopHits?.toString() || "0", highlight: "warning" },
                  { label: t("simulations.initialCapital"), value: `${isRTL ? 'ريال' : 'SAR'} ${selectedSimulation.initial_capital.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}` },
                  { label: t("simulations.period"), value: `${Math.round((new Date(selectedSimulation.end_date).getTime() - new Date(selectedSimulation.start_date).getTime()) / (1000 * 60 * 60 * 24))} ${t("simulations.days")}` },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="border-2 border-border bg-card p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {metric.label}
                    </p>
                    <p className={cn(
                      "font-mono font-semibold",
                      (metric as any).highlight === "loss" && "text-loss",
                      (metric as any).highlight === "profit" && "text-profit",
                      (metric as any).highlight === "warning" && "text-warning"
                    )}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <EquityCurveChart />

              <div className="grid gap-6 md:grid-cols-2">
                <DrawdownChart />
                <MonthlyReturnsChart />
              </div>

              {/* Trades Table */}
              <div className="border-2 border-border bg-card">
                <div className={cn("flex items-center justify-between border-b-2 border-border px-4 py-3", isRTL && "flex-row-reverse")}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider">
                    {t("simulations.tradeHistory")}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {trades.length} {t("simulations.trades")}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b-2 border-border bg-muted/50">
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                          {t("simulations.date")}
                        </th>
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                          {t("simulations.type")}
                        </th>
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-right" : "text-left")}>
                          {t("simulations.exitReason")}
                        </th>
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                          {t("market.price")}
                        </th>
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                          {t("simulations.quantity")}
                        </th>
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                          {t("simulations.value")}
                        </th>
                        <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>
                          {t("simulations.pnl")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-border">
                      {trades.map((trade, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-sm">
                            {trade.date}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-semibold border-2",
                                trade.type === "BUY"
                                  ? "border-profit/30 bg-profit/10 text-profit"
                                  : "border-loss/30 bg-loss/10 text-loss"
                              )}
                            >
                              {trade.type === "BUY" ? (isRTL ? "شراء" : "BUY") : (isRTL ? "بيع" : "SELL")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {trade.type === 'SELL' && trade.exitReason && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-xs font-semibold border",
                                  trade.exitReason === "stop_loss" && "border-loss/50 bg-loss/10 text-loss",
                                  trade.exitReason === "take_profit" && "border-profit/50 bg-profit/10 text-profit",
                                  trade.exitReason === "trailing_stop" && "border-warning/50 bg-warning/10 text-warning",
                                  trade.exitReason === "signal" && "border-border bg-muted text-muted-foreground"
                                )}
                              >
                                {trade.exitReason === "stop_loss" && (isRTL ? "وقف الخسارة" : "Stop Loss")}
                                {trade.exitReason === "take_profit" && (isRTL ? "جني الأرباح" : "Take Profit")}
                                {trade.exitReason === "trailing_stop" && (isRTL ? "وقف متحرك" : "Trailing Stop")}
                                {trade.exitReason === "signal" && (isRTL ? "إشارة" : "Signal")}
                              </span>
                            )}
                            {trade.type === 'BUY' && (
                              <span className="text-xs text-muted-foreground">{t("simulations.entry")}</span>
                            )}
                          </td>
                          <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                            {trade.price.toFixed(2)}
                          </td>
                          <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                            {trade.quantity}
                          </td>
                          <td className={cn("px-4 py-3 font-mono text-sm", isRTL ? "text-left" : "text-right")}>
                            {trade.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 font-mono text-sm font-semibold",
                              isRTL ? "text-left" : "text-right",
                              trade.pnl
                                ? trade.pnl > 0
                                  ? "text-profit"
                                  : "text-loss"
                                : "text-muted-foreground"
                            )}
                          >
                            {trade.pnl
                              ? `${trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border py-20 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{isRTL ? "لا توجد نتائج محاكاة" : "No Simulation Results"}</h3>
              <p className="text-muted-foreground max-w-md">
                {strategies?.length === 0 
                  ? (isRTL ? "أنشئ استراتيجية أولاً في منشئ الاستراتيجيات، ثم شغّل المحاكاة." : "Create a strategy first in the Strategy Builder, then run a simulation.")
                  : (isRTL ? "اختر استراتيجية واضغط \"تشغيل المحاكاة\" لرؤية نتائج الاختبار الرجعي." : "Select a strategy and click \"Run Simulation\" to see your backtest results.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Simulations;
