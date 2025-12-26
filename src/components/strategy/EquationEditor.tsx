import { useState } from "react";
import { cn } from "@/lib/utils";

interface EquationEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

const KEYWORDS = ["AND", "OR", "NOT"];
const FUNCTIONS = [
  "SMA",
  "EMA",
  "RSI",
  "MACD",
  "BBANDS",
  "ATR",
  "STOCHASTIC",
  "BB_UPPER",
  "BB_LOWER",
];
const VARIABLES = ["OPEN", "HIGH", "LOW", "CLOSE", "VOLUME"];
const OPERATORS = [">", "<", ">=", "<=", "==", "!=", "+", "-", "*", "/"];

export function EquationEditor({
  value,
  onChange,
  placeholder,
  label,
}: EquationEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  const highlightSyntax = (text: string) => {
    let result = text;

    // Highlight functions
    FUNCTIONS.forEach((fn) => {
      const regex = new RegExp(`\\b(${fn})\\b`, "g");
      result = result.replace(
        regex,
        `<span class="text-primary font-semibold">$1</span>`
      );
    });

    // Highlight keywords
    KEYWORDS.forEach((kw) => {
      const regex = new RegExp(`\\b(${kw})\\b`, "g");
      result = result.replace(
        regex,
        `<span class="text-warning font-semibold">$1</span>`
      );
    });

    // Highlight variables
    VARIABLES.forEach((v) => {
      const regex = new RegExp(`\\b(${v})\\b`, "g");
      result = result.replace(
        regex,
        `<span class="text-profit font-semibold">$1</span>`
      );
    });

    // Highlight numbers
    result = result.replace(
      /\b(\d+(?:\.\d+)?)\b/g,
      `<span class="text-chart-4">$1</span>`
    );

    return result;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold uppercase tracking-wider">
        {label}
      </label>
      <div
        className={cn(
          "relative equation-editor min-h-[100px] transition-all",
          isFocused && "ring-2 ring-ring"
        )}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="absolute inset-0 h-full w-full resize-none bg-transparent font-mono text-sm text-transparent caret-foreground outline-none"
          spellCheck={false}
        />
        <div
          className="pointer-events-none whitespace-pre-wrap font-mono text-sm"
          dangerouslySetInnerHTML={{
            __html: highlightSyntax(value) || `<span class="text-muted-foreground">${placeholder || ""}</span>`,
          }}
        />
      </div>
    </div>
  );
}

export function EquationHelp() {
  return (
    <div className="border-2 border-border bg-muted/30 p-4 space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wider">
        Equation Reference
      </h4>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            VARIABLES
          </p>
          <div className="flex flex-wrap gap-1">
            {VARIABLES.map((v) => (
              <span
                key={v}
                className="px-2 py-0.5 text-xs font-mono bg-profit/10 text-profit border border-profit/30"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            FUNCTIONS
          </p>
          <div className="flex flex-wrap gap-1">
            {FUNCTIONS.map((fn) => (
              <span
                key={fn}
                className="px-2 py-0.5 text-xs font-mono bg-primary/10 text-primary border border-primary/30"
              >
                {fn}(n)
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            OPERATORS
          </p>
          <div className="flex flex-wrap gap-1">
            {[...OPERATORS, ...KEYWORDS].map((op) => (
              <span
                key={op}
                className="px-2 py-0.5 text-xs font-mono bg-muted text-foreground border border-border"
              >
                {op}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            EXAMPLES
          </p>
          <div className="space-y-1 font-mono text-xs">
            <p className="text-muted-foreground">
              <span className="text-profit">RSI</span>(14) &lt; 30{" "}
              <span className="text-warning">AND</span>{" "}
              <span className="text-profit">CLOSE</span> &gt;{" "}
              <span className="text-profit">SMA</span>(50)
            </p>
            <p className="text-muted-foreground">
              <span className="text-profit">MACD</span>(12, 26, 9) &gt; 0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
