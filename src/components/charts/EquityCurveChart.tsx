import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Scatter,
  Line,
} from "recharts";
import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/ui/glass-panel";

interface Trade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  value: number;
  commission: number;
  pnl?: number;
  exitReason?: 'signal' | 'stop_loss' | 'take_profit' | 'trailing_stop';
}

interface EquityCurveChartProps {
  dates?: string[];
  equity?: number[];
  trades?: Trade[];
  benchmark?: number[];
  showTrades?: boolean;
}

// Generate mock equity curve data as fallback
const generateMockEquityData = () => {
  const data = [];
  let equity = 100000;
  const startDate = new Date("2024-01-01");

  for (let i = 0; i < 250; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const change = (Math.random() - 0.45) * 2000;
    equity = Math.max(equity + change, 50000);

    data.push({
      date: date.toISOString().split("T")[0],
      equity: Math.round(equity),
      benchmark: 100000 + i * 50 + (Math.random() - 0.5) * 5000,
    });
  }
  return data;
};

// Custom dot for trade markers
const TradeMarker = (props: any) => {
  const { cx, cy, payload } = props;
  
  if (!payload.tradeType) return null;
  
  const isBuy = payload.tradeType === 'BUY';
  const size = 8;
  
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={size + 4}
        fill={isBuy ? "#34D399" : "#F472B6"}
        fillOpacity={0.2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={isBuy ? "#34D399" : "#F472B6"}
        stroke="#020617"
        strokeWidth={2}
      />
      {isBuy ? (
        <path
          d={`M${cx} ${cy - 3} L${cx - 3} ${cy + 2} L${cx + 3} ${cy + 2} Z`}
          fill="#020617"
        />
      ) : (
        <path
          d={`M${cx} ${cy + 3} L${cx - 3} ${cy - 2} L${cx + 3} ${cy - 2} Z`}
          fill="#020617"
        />
      )}
    </g>
  );
};

// Custom tooltip with trade info
const CustomTooltip = ({ active, payload, label }: any) => {
  const { isRTL } = useLanguage();
  
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0]?.payload;
  const hasTrade = data?.tradeType;
  
  return (
    <div className="glass-panel p-3 text-sm rounded-lg">
      <p className="font-mono text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold">
        {isRTL ? "رأس المال:" : "Equity:"}{" "}
        <span className="text-primary font-mono">
          SAR {data?.equity?.toLocaleString() || "N/A"}
        </span>
      </p>
      {data?.benchmark && (
        <p className="text-muted-foreground text-xs">
          {isRTL ? "المؤشر:" : "Benchmark:"}{" "}
          <span className="font-mono">
            SAR {Math.round(data.benchmark).toLocaleString()}
          </span>
        </p>
      )}
      {hasTrade && (
        <div className={cn(
          "mt-2 pt-2 border-t border-border/50",
          data.tradeType === 'BUY' ? "text-profit" : "text-secondary"
        )}>
          <p className="font-semibold flex items-center gap-2">
            <span className={cn(
              "inline-block w-2 h-2 rounded-full",
              data.tradeType === 'BUY' ? "bg-profit" : "bg-secondary"
            )} />
            {data.tradeType === 'BUY' ? (isRTL ? "شراء" : "BUY") : (isRTL ? "بيع" : "SELL")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isRTL ? "السعر:" : "Price:"} {data.tradePrice?.toFixed(2)} SAR
          </p>
        </div>
      )}
    </div>
  );
};

export function EquityCurveChart({ 
  dates, 
  equity, 
  trades = [],
  benchmark,
  showTrades = true 
}: EquityCurveChartProps) {
  const { isRTL } = useLanguage();

  const chartData = useMemo(() => {
    if (!dates || !equity || dates.length === 0) {
      return generateMockEquityData();
    }

    const tradeMap = new Map<string, Trade>();
    trades.forEach(trade => {
      tradeMap.set(trade.date, trade);
    });

    return dates.map((date, index) => {
      const trade = tradeMap.get(date);
      
      return {
        date,
        equity: equity[index],
        benchmark: benchmark?.[index] ?? equity[0] + (index * (equity[equity.length - 1] - equity[0]) / dates.length * 0.5),
        tradeType: trade?.type,
        tradePrice: trade?.price,
        tradeQty: trade?.quantity,
        tradePnl: trade?.pnl,
        exitReason: trade?.exitReason,
        tradeMarker: trade ? equity[index] : null,
      };
    });
  }, [dates, equity, trades, benchmark]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border/30 bg-card/20 backdrop-blur-sm">
      {/* Floating HUD Data */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-mono">
            {chartData[chartData.length - 1]?.equity?.toLocaleString() || "11,405.20"}
          </h2>
          <span className="text-sm text-profit font-bold">+0.45%</span>
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground font-mono">
          <span>O: <span className="text-foreground/80">11,390</span></span>
          <span>H: <span className="text-foreground/80">11,420</span></span>
          <span>L: <span className="text-foreground/80">11,380</span></span>
          <span>V: <span className="text-primary">4.2M</span></span>
        </div>
      </div>

      <div className="h-[350px] md:h-[450px] pt-16">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="equityGradientNeon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.03)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#64748B" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short" });
              }}
              reversed={isRTL}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748B", fontFamily: "Fira Code" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              domain={["dataMin - 5000", "dataMax + 5000"]}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Benchmark dashed line */}
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#475569"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            
            {/* Main equity curve */}
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#22D3EE"
              strokeWidth={3}
              fill="url(#equityGradientNeon)"
            />
            
            {/* Trade markers */}
            {showTrades && trades.length > 0 && (
              <Scatter dataKey="tradeMarker" shape={<TradeMarker />} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Gradient floor inside chart */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </div>
  );
}
