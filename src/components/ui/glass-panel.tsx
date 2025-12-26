import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "accent" | "success" | "warning" | "danger";
  glow?: boolean;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", glow = false, children, ...props }, ref) => {
    const glowClasses = {
      default: glow ? "hover:shadow-glow-cyan" : "",
      accent: glow ? "hover:shadow-glow-cyan border-t-primary/50" : "border-t-primary/50",
      success: glow ? "hover:shadow-glow-green border-t-profit/50" : "border-t-profit/50",
      warning: glow ? "hover:shadow-glow-amber border-t-warning/50" : "border-t-warning/50",
      danger: glow ? "hover:shadow-glow-pink border-t-secondary/50" : "border-t-secondary/50",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel rounded-2xl",
          glowClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
