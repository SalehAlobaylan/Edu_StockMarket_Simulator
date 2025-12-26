import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supported variables
const VARIABLES = ["OPEN", "HIGH", "LOW", "CLOSE", "VOLUME"];

// Supported functions with their parameter counts
const FUNCTIONS: Record<string, { minParams: number; maxParams: number; description: string }> = {
  "SMA": { minParams: 1, maxParams: 1, description: "Simple Moving Average" },
  "EMA": { minParams: 1, maxParams: 1, description: "Exponential Moving Average" },
  "RSI": { minParams: 1, maxParams: 1, description: "Relative Strength Index" },
  "MACD": { minParams: 0, maxParams: 3, description: "Moving Average Convergence Divergence" },
  "BBANDS": { minParams: 0, maxParams: 2, description: "Bollinger Bands" },
  "ATR": { minParams: 0, maxParams: 1, description: "Average True Range" },
  "STOCHASTIC": { minParams: 0, maxParams: 3, description: "Stochastic Oscillator" },
  "ADX": { minParams: 0, maxParams: 1, description: "Average Directional Index" },
};

// Derived values from indicators
const DERIVED_VALUES = [
  "MACD_LINE", "MACD_SIGNAL", "MACD_HISTOGRAM",
  "BB_UPPER", "BB_LOWER", "BB_MIDDLE",
  "STOCH_K", "STOCH_D",
];

// Operators
const OPERATORS = [">", "<", ">=", "<=", "==", "!=", "AND", "OR", "NOT"];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  indicators: string[];
  variables: string[];
  suggestions: string[];
}

function validateEquation(equation: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    indicators: [],
    variables: [],
    suggestions: [],
  };

  if (!equation || equation.trim().length === 0) {
    result.isValid = false;
    result.errors.push("Equation cannot be empty");
    return result;
  }

  const expr = equation.toUpperCase().trim();
  
  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of expr) {
    if (char === "(") parenCount++;
    if (char === ")") parenCount--;
    if (parenCount < 0) {
      result.isValid = false;
      result.errors.push("Unbalanced parentheses: too many closing parentheses");
      break;
    }
  }
  if (parenCount > 0) {
    result.isValid = false;
    result.errors.push("Unbalanced parentheses: missing closing parentheses");
  }

  // Extract and validate function calls
  const functionPattern = /([A-Z_]+)\s*\(([^)]*)\)/g;
  let match;
  while ((match = functionPattern.exec(expr)) !== null) {
    const funcName = match[1];
    const params = match[2];
    
    if (FUNCTIONS[funcName]) {
      const paramCount = params.trim() ? params.split(",").length : 0;
      const funcDef = FUNCTIONS[funcName];
      
      if (paramCount < funcDef.minParams) {
        result.errors.push(`${funcName} requires at least ${funcDef.minParams} parameter(s)`);
        result.isValid = false;
      } else if (paramCount > funcDef.maxParams) {
        result.errors.push(`${funcName} accepts at most ${funcDef.maxParams} parameter(s)`);
        result.isValid = false;
      }
      
      // Validate numeric parameters
      if (params.trim()) {
        const paramValues = params.split(",").map(p => p.trim());
        for (const param of paramValues) {
          if (!/^\d+(\.\d+)?$/.test(param)) {
            result.errors.push(`Invalid parameter "${param}" in ${funcName}() - must be a number`);
            result.isValid = false;
          }
        }
      }
      
      // Add to indicators list with parameters
      const indicatorKey = params.trim() ? `${funcName}(${params.trim()})` : funcName;
      if (!result.indicators.includes(indicatorKey)) {
        result.indicators.push(indicatorKey);
      }
    } else if (!VARIABLES.includes(funcName)) {
      // Check for typos and suggest corrections
      const possibleMatches = Object.keys(FUNCTIONS).filter(f => 
        f.includes(funcName.slice(0, 2)) || funcName.includes(f.slice(0, 2))
      );
      
      if (possibleMatches.length > 0) {
        result.suggestions.push(`Unknown function "${funcName}". Did you mean: ${possibleMatches.join(", ")}?`);
      } else {
        result.errors.push(`Unknown function "${funcName}"`);
      }
      result.isValid = false;
    }
  }

  // Check for variables used
  for (const variable of VARIABLES) {
    if (expr.includes(variable) && !result.variables.includes(variable)) {
      result.variables.push(variable);
    }
  }

  // Check for derived values
  for (const derived of DERIVED_VALUES) {
    if (expr.includes(derived) && !result.indicators.includes(derived)) {
      result.indicators.push(derived);
    }
  }

  // Check for unknown identifiers (potential typos)
  const wordPattern = /\b([A-Z_]+)\b/g;
  while ((match = wordPattern.exec(expr)) !== null) {
    const word = match[1];
    
    // Skip if it's a known element
    if (
      VARIABLES.includes(word) ||
      FUNCTIONS[word] ||
      DERIVED_VALUES.includes(word) ||
      OPERATORS.includes(word) ||
      /^\d+$/.test(word)
    ) {
      continue;
    }
    
    // Suggest corrections for unknown words
    const allKnown = [...VARIABLES, ...Object.keys(FUNCTIONS), ...DERIVED_VALUES];
    const similar = allKnown.filter(k => 
      k.includes(word.slice(0, 3)) || word.includes(k.slice(0, 3))
    );
    
    if (similar.length > 0 && !result.suggestions.some(s => s.includes(word))) {
      result.suggestions.push(`Unknown "${word}". Did you mean: ${similar.slice(0, 3).join(", ")}?`);
    }
  }

  // Add warnings for common issues
  if (expr.includes("RSI") && !expr.includes("<") && !expr.includes(">")) {
    result.warnings.push("RSI is typically used with comparison operators (< 30 for oversold, > 70 for overbought)");
  }

  if (result.indicators.length === 0 && result.variables.length === 0) {
    result.warnings.push("No indicators or price variables detected in the equation");
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { equation, type = "entry" } = await req.json();

    console.log(`Validating ${type} equation: ${equation}`);

    const result = validateEquation(equation);

    console.log("Validation result:", result);

    return new Response(
      JSON.stringify({
        equation,
        type,
        ...result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error validating equation:", error);
    return new Response(
      JSON.stringify({ 
        isValid: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        warnings: [],
        indicators: [],
        variables: [],
        suggestions: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
