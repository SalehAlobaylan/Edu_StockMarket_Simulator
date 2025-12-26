import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Star,
  Play,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Mock stock info
const stockInfo: Record<string, { name: string; sector: string; currency: string }> = {
  "2222": { name: "Saudi Aramco", sector: "Energy", currency: "SAR" },
  "1180": { name: "Al Rajhi Bank", sector: "Banking", currency: "SAR" },
  "TASI": { name: "TASI Index", sector: "Index", currency: "SAR" },
  "2010": { name: "SABIC", sector: "Materials", currency: "SAR" },
  "7010": { name: "STC", sector: "Telecom", currency: "SAR" },
};

// Generate mock OHLCV data with indicators
const generateChartData = () => {
  const data = [];
  const startDate = new Date("2024-01-01");
  let close = 28.50;
  let sma20Sum = 0;
  let sma50Sum = 0;
  const sma20Values: number[] = [];
  const sma50Values: number[] = [];
  const rsiGains: number[] = [];
  const rsiLosses: number[] = [];

  for (let i = 0; i < 200; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const change = (Math.random() - 0.48) * 2;
    const open = close;
    close = Math.max(20, Math.min(40, close + change));
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    const volume = Math.floor(Math.random() * 10000000 + 5000000);

    // Calculate SMA
    sma20Values.push(close);
    sma50Values.push(close);
    if (sma20Values.length > 20) sma20Values.shift();
    if (sma50Values.length > 50) sma50Values.shift();
    
    const sma20 = sma20Values.reduce((a, b) => a + b, 0) / sma20Values.length;
    const sma50 = sma50Values.length >= 50 
      ? sma50Values.reduce((a, b) => a + b, 0) / sma50Values.length 
      : null;

    // Calculate RSI (simplified)
    const priceChange = i > 0 ? close - data[i - 1]?.close || 0 : 0;
    rsiGains.push(priceChange > 0 ? priceChange : 0);
    rsiLosses.push(priceChange < 0 ? Math.abs(priceChange) : 0);
    if (rsiGains.length > 14) {
      rsiGains.shift();
      rsiLosses.shift();
    }
    const avgGain = rsiGains.reduce((a, b) => a + b, 0) / 14;
    const avgLoss = rsiLosses.reduce((a, b) => a + b, 0) / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Bollinger Bands
    const stdDev = Math.sqrt(
      sma20Values.reduce((sum, val) => sum + Math.pow(val - sma20, 2), 0) / sma20Values.length
    );
    const bbUpper = sma20 + 2 * stdDev;
    const bbLower = sma20 - 2 * stdDev;

    data.push({
      date: date.toISOString().split("T")[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      sma20: Number(sma20.toFixed(2)),
      sma50: sma50 ? Number(sma50.toFixed(2)) : null,
      rsi: Number(rsi.toFixed(2)),
      bbUpper: Number(bbUpper.toFixed(2)),
      bbLower: Number(bbLower.toFixed(2)),
    });
  }
  return data;
};

const chartData = generateChartData();

const StockDetail = () => {
  const { ticker = "2222" } = useParams();
  const { language, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  const [timeframe, setTimeframe] = useState("1Y");
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const stock = stockInfo[ticker] || { name: ticker, sector: "Unknown", currency: "SAR" };
  const latestData = chartData[chartData.length - 1];
  const previousData = chartData[chartData.length - 2];
  const priceChange = latestData.close - previousData.close;
  const priceChangePct = (priceChange / previousData.close) * 100;

  return (
    <AppLayout>
      {/* Back Navigation */}
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/market">
            <ArrowIcon className="h-4 w-4" />
            {language === "ar" ? "العودة إلى بيانات السوق" : "Back to Market Data"}
          </Link>
        </Button>
      </div>

      {/* Stock Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-mono">{ticker}</h1>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="text-muted-foreground hover:text-warning"
            >
              <Star className={cn("h-6 w-6", isFavorite && "fill-warning text-warning")} />
            </button>
          </div>
          <p className="text-lg text-muted-foreground">{stock.name}</p>
          <span className="mt-1 inline-block px-2 py-0.5 text-xs border-2 border-border bg-muted">
            {stock.sector}
          </span>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold font-mono">
            {latestData.close.toFixed(2)} <span className="text-lg text-muted-foreground">{stock.currency}</span>
          </p>
          <div className={cn(
            "flex items-center justify-end gap-1 font-mono font-semibold",
            priceChange > 0 ? "text-profit" : "text-loss"
          )}>
            {priceChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {priceChange > 0 && "+"}{priceChange.toFixed(2)} ({priceChangePct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className="border-2"
            >
              {tf}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox id="sma20" checked={showSMA20} onCheckedChange={(c) => setShowSMA20(!!c)} />
            <Label htmlFor="sma20" className="text-sm cursor-pointer">SMA(20)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sma50" checked={showSMA50} onCheckedChange={(c) => setShowSMA50(!!c)} />
            <Label htmlFor="sma50" className="text-sm cursor-pointer">SMA(50)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="bb" checked={showBB} onCheckedChange={(c) => setShowBB(!!c)} />
            <Label htmlFor="bb" className="text-sm cursor-pointer">Bollinger</Label>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="border-2 border-border bg-card p-4 mb-4">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />

              {/* Bollinger Bands */}
              {showBB && (
                <>
                  <Area
                    type="monotone"
                    dataKey="bbUpper"
                    stroke="none"
                    fill="hsl(var(--muted))"
                    fillOpacity={0.3}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbUpper"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbLower"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </>
              )}

              {/* Price Line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name={language === "ar" ? "السعر" : "Price"}
              />

              {/* Moving Averages */}
              {showSMA20 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA(20)"
                />
              )}
              {showSMA50 && (
                <Line
                  type="monotone"
                  dataKey="sma50"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={1.5}
                  dot={false}
                  name="SMA(50)"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume & RSI Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Volume */}
        {showVolume && (
          <div className="border-2 border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
              {language === "ar" ? "حجم التداول" : "Volume"}
            </h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.slice(-60)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" opacity={0.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* RSI */}
        {showRSI && (
          <div className="border-2 border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider">
              RSI(14)
            </h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-60)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={false} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    ticks={[30, 50, 70]}
                  />
                  <ReferenceLine y={70} stroke="hsl(var(--loss))" strokeDasharray="3 3" />
                  <ReferenceLine y={30} stroke="hsl(var(--profit))" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span className="text-profit">{language === "ar" ? "ذروة البيع" : "Oversold"} &lt; 30</span>
              <span className="text-loss">{language === "ar" ? "ذروة الشراء" : "Overbought"} &gt; 70</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: language === "ar" ? "الفتح" : "Open", value: latestData.open.toFixed(2) },
          { label: language === "ar" ? "الأعلى" : "High", value: latestData.high.toFixed(2) },
          { label: language === "ar" ? "الأدنى" : "Low", value: latestData.low.toFixed(2) },
          { label: language === "ar" ? "الإغلاق" : "Close", value: latestData.close.toFixed(2) },
          { label: "SMA(20)", value: latestData.sma20.toFixed(2) },
          { label: "RSI(14)", value: latestData.rsi.toFixed(1) },
        ].map((stat) => (
          <div key={stat.label} className="border-2 border-border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="font-mono font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Button asChild className="gap-2 border-2">
          <Link to="/strategy">
            <Play className="h-4 w-4" />
            {language === "ar" ? "إنشاء استراتيجية" : "Create Strategy"}
          </Link>
        </Button>
        <Button variant="outline" className="gap-2 border-2">
          <Calendar className="h-4 w-4" />
          {language === "ar" ? "تصدير البيانات" : "Export Data"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default StockDetail;
