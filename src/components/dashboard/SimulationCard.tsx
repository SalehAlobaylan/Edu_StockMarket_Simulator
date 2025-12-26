import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";

export interface SimulationData {
  id: string;
  name: string;
  ticker: string;
  strategy: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
  status: "completed" | "running" | "failed";
  createdAt: string;
}

interface SimulationCardProps {
  simulation: SimulationData;
}

export function SimulationCard({ simulation }: SimulationCardProps) {
  const isPositive = simulation.totalReturn > 0;

  return (
    <GlassPanel className="group p-4 transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="ticker-badge">{simulation.ticker}</span>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded",
                simulation.status === "completed" &&
                  "bg-profit/10 text-profit border border-profit/20",
                simulation.status === "running" &&
                  "bg-warning/10 text-warning border border-warning/20",
                simulation.status === "failed" &&
                  "bg-secondary/10 text-secondary border border-secondary/20"
              )}
            >
              {simulation.status.toUpperCase()}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{simulation.name}</h3>
          <p className="text-xs text-muted-foreground">{simulation.strategy}</p>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "flex items-center gap-1 text-xl font-bold font-mono",
              isPositive ? "text-profit text-glow-green" : "text-secondary text-glow-pink"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            {isPositive && "+"}
            {simulation.totalReturn.toFixed(2)}%
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Return</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Sharpe</p>
          <p className="font-mono font-semibold text-warning">
            {simulation.sharpeRatio.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Max DD</p>
          <p className="font-mono font-semibold text-secondary">
            -{simulation.maxDrawdown.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Trades</p>
          <p className="font-mono font-semibold">{simulation.trades}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button asChild size="sm" className="flex-1 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20">
          <Link to={`/simulations/${simulation.id}`}>View Results</Link>
        </Button>
        <Button variant="outline" size="sm" className="border-border/50 text-muted-foreground hover:text-foreground hover:bg-foreground/5">
          Compare
        </Button>
      </div>
    </GlassPanel>
  );
}
