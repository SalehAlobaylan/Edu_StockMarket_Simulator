import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "profit" | "loss" | "warning";
  glowColor?: "cyan" | "green" | "pink" | "amber";
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  variant = "default",
  glowColor,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === 0;

  const glowClasses = {
    cyan: "border-t-primary/50 hover:shadow-glow-cyan",
    green: "border-t-profit/50 hover:shadow-glow-green",
    pink: "border-t-secondary/50 hover:shadow-glow-pink",
    amber: "border-t-warning/50 hover:shadow-glow-amber",
  };

  const valueColorClasses = {
    default: "text-foreground",
    profit: "text-profit text-glow-green",
    loss: "text-secondary text-glow-pink",
    warning: "text-warning text-glow-amber",
  };

  return (
    <GlassPanel 
      className={cn(
        "p-4 md:p-5 group relative overflow-hidden transition-all hover:-translate-y-0.5",
        glowColor && glowClasses[glowColor],
        className
      )}
    >
      {/* Background icon watermark */}
      {icon && (
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <div className="w-20 h-20 md:w-24 md:h-24 text-foreground transform rotate-12">
            {icon}
          </div>
        </div>
      )}

      <div className="relative z-10 space-y-2">
        <p className="metric-label">{title}</p>
        <p className={cn("metric-value font-mono", valueColorClasses[variant])}>
          {value}
        </p>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {isPositive && <TrendingUp className="h-3 w-3 text-profit" />}
            {isNegative && <TrendingDown className="h-3 w-3 text-secondary" />}
            {isNeutral && <Minus className="h-3 w-3 text-muted-foreground" />}
            <span
              className={cn(
                "text-xs font-semibold font-mono",
                isPositive && "text-profit",
                isNegative && "text-secondary",
                isNeutral && "text-muted-foreground"
              )}
            >
              {isPositive && "+"}
              {change.toFixed(2)}%
            </span>
            {changeLabel && (
              <span className="text-[10px] text-muted-foreground">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Animated progress bar at bottom */}
      {variant === "profit" && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-muted">
          <div className="h-full w-2/3 bg-gradient-to-r from-profit to-neon-green shadow-glow-green relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-foreground rounded-full shadow-[0_0_5px_#fff]" />
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
