import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SimulationCard } from "@/components/dashboard/SimulationCard";
import { MarketTicker } from "@/components/dashboard/MarketTicker";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { TrendingUp, Activity, Target, Zap, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSimulations } from "@/hooks/useSimulations";
import { usePortfolio, useHoldings } from "@/hooks/usePortfolio";
import { useStrategies } from "@/hooks/useStrategies";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const { data: simulations = [], isLoading: loadingSims } = useSimulations();
  const { data: portfolio } = usePortfolio();
  const { data: holdings = [] } = useHoldings(portfolio?.id ?? null);
  const { data: strategies = [] } = useStrategies();

  const stats = useMemo(() => {
    const completedSims = simulations.filter(s => s.status === "completed");
    const bestReturn = completedSims.length > 0 
      ? Math.max(...completedSims.map(s => s.total_return_pct ?? 0))
      : 124.5;
    
    const portfolioValue = portfolio 
      ? portfolio.cash_balance + holdings.reduce((sum, h) => sum + h.quantity * h.avg_price, 0)
      : 100000;

    return {
      portfolioValue,
      activeStrategies: strategies.length || 3,
      bestReturn,
      simulationsRun: simulations.length || 12,
    };
  }, [simulations, portfolio, holdings, strategies]);

  const recentSimulations = useMemo(() => {
    return simulations.slice(0, 2).map(sim => ({
      id: sim.id,
      name: sim.name,
      ticker: sim.ticker,
      strategy: sim.strategy_id ? "Custom Strategy" : "Manual",
      totalReturn: sim.total_return_pct ?? 0,
      sharpeRatio: sim.sharpe_ratio ?? 0,
      maxDrawdown: sim.max_drawdown_pct ?? 0,
      trades: sim.num_trades ?? 0,
      status: sim.status as "completed" | "running" | "failed",
      createdAt: sim.created_at.split("T")[0],
    }));
  }, [simulations]);

  return (
    <AppLayout>
      <div className="grid grid-cols-12 gap-4 md:gap-6 max-w-[1800px] mx-auto">
        {/* Left Panel - Quick Stats */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          {/* Hero Metric */}
          <StatCard
            title="Total Alpha"
            value={`+${stats.bestReturn.toFixed(1)}%`}
            variant="profit"
            glowColor="green"
            icon={<Activity className="w-full h-full" />}
          />

          {/* Compact Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Max DD" value="-8.4%" variant="loss" glowColor="pink" />
            <StatCard title="Sharpe" value="2.14" glowColor="amber" />
          </div>

          {/* Quick Actions */}
          <GlassPanel className="p-4">
            <h3 className="metric-label mb-3">{t("dashboard.quickActions")}</h3>
            <div className="space-y-2">
              <Button asChild className="w-full justify-start gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20">
                <Link to="/strategy"><Plus className="h-4 w-4" />{t("dashboard.newStrategy")}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 border-border/50 text-muted-foreground hover:text-foreground hover:bg-foreground/5">
                <Link to="/simulations"><Activity className="h-4 w-4" />{t("dashboard.runBacktest")}</Link>
              </Button>
            </div>
          </GlassPanel>
        </aside>

        {/* Center - Main Chart */}
        <section className="col-span-12 lg:col-span-6">
          <EquityCurveChart />
        </section>

        {/* Right Panel - Market Feed */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <MarketTicker />
          
          {/* Recent Simulations */}
          <GlassPanel className="p-4">
            <div className={cn("mb-4 flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <h3 className="metric-label">{t("dashboard.recentSimulations")}</h3>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                <Link to="/simulations">{t("dashboard.viewAll")}<ArrowIcon className="h-3 w-3" /></Link>
              </Button>
            </div>
            {loadingSims ? (
              <div className="space-y-3"><Skeleton className="h-20 bg-muted/20" /><Skeleton className="h-20 bg-muted/20" /></div>
            ) : recentSimulations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No simulations yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSimulations.map((sim) => <SimulationCard key={sim.id} simulation={sim} />)}
              </div>
            )}
          </GlassPanel>
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
