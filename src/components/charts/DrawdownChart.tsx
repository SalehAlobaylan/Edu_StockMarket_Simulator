import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generate drawdown data
const generateDrawdownData = () => {
  const data = [];
  const startDate = new Date("2024-01-01");

  for (let i = 0; i < 250; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Simulate drawdown patterns
    let drawdown = 0;
    if (i > 30 && i < 60) {
      drawdown = -((i - 30) * 0.3);
    } else if (i > 100 && i < 150) {
      drawdown = -Math.abs(Math.sin((i - 100) * 0.1) * 12);
    } else if (i > 180 && i < 200) {
      drawdown = -((i - 180) * 0.4);
    }

    data.push({
      date: date.toISOString().split("T")[0],
      drawdown: Math.min(drawdown, 0),
    });
  }
  return data;
};

const drawdownData = generateDrawdownData();

export function DrawdownChart() {
  return (
    <div className="chart-container">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Drawdown
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Max Drawdown:</span>
          <span className="font-mono text-sm font-semibold text-loss">
            -12.45%
          </span>
        </div>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={drawdownData}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--loss))"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--loss))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
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
                return date.toLocaleDateString("en-US", { month: "short" });
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value}%`}
              domain={[-15, 0]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: 0,
                fontSize: 12,
              }}
              formatter={(value: number) => [
                `${value.toFixed(2)}%`,
                "Drawdown",
              ]}
            />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="hsl(var(--loss))"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
