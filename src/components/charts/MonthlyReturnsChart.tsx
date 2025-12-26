import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

// Mock monthly returns data
const monthlyReturns = [
  { month: "Jan", return: 5.2 },
  { month: "Feb", return: -2.1 },
  { month: "Mar", return: 3.8 },
  { month: "Apr", return: 1.5 },
  { month: "May", return: -4.2 },
  { month: "Jun", return: 6.1 },
  { month: "Jul", return: 2.3 },
  { month: "Aug", return: -1.8 },
  { month: "Sep", return: 4.5 },
  { month: "Oct", return: 3.2 },
  { month: "Nov", return: -0.5 },
  { month: "Dec", return: 2.8 },
];

export function MonthlyReturnsChart() {
  return (
    <div className="chart-container">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Monthly Returns
        </h3>
        <span className="text-xs text-muted-foreground">2024</span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyReturns} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: 0,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, "Return"]}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={2} />
            <Bar dataKey="return" radius={0}>
              {monthlyReturns.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.return >= 0
                      ? "hsl(var(--profit))"
                      : "hsl(var(--loss))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
