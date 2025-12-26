import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EquationTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  entry_logic: string;
  exit_logic: string;
  created_at: string | null;
}

export interface ValidationResult {
  equation: string;
  type: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  indicators: string[];
  variables: string[];
  suggestions: string[];
}

// Fetch all equation templates
export function useEquationTemplates() {
  return useQuery({
    queryKey: ["equation-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equation_templates")
        .select("*")
        .order("category", { ascending: true })
        .order("difficulty", { ascending: true });

      if (error) throw error;
      return data as EquationTemplate[];
    },
  });
}

// Fetch templates by category
export function useEquationTemplatesByCategory(category: string | null) {
  return useQuery({
    queryKey: ["equation-templates", category],
    queryFn: async () => {
      if (!category) {
        const { data, error } = await supabase
          .from("equation_templates")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        return data as EquationTemplate[];
      }

      const { data, error } = await supabase
        .from("equation_templates")
        .select("*")
        .eq("category", category)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as EquationTemplate[];
    },
  });
}

// Fetch template categories
export function useTemplateCategories() {
  return useQuery({
    queryKey: ["equation-template-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equation_templates")
        .select("category")
        .not("category", "is", null);

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set(data.map((t) => t.category))].filter(Boolean) as string[];
      return categories.sort();
    },
  });
}

// Validate an equation using edge function
export function useValidateEquation() {
  return useMutation({
    mutationFn: async ({ equation, type = "entry" }: { equation: string; type?: "entry" | "exit" }): Promise<ValidationResult> => {
      const response = await supabase.functions.invoke("validate-equation", {
        body: { equation, type },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to validate equation");
      }

      return response.data;
    },
  });
}

// Parse indicators from equation (client-side quick parse)
export function parseIndicators(equation: string): string[] {
  const indicators: string[] = [];
  const pattern = /(SMA|EMA|RSI|MACD|BBANDS|ATR|STOCHASTIC|ADX)\s*\([^)]*\)/gi;
  const matches = equation.match(pattern);
  
  if (matches) {
    for (const match of matches) {
      if (!indicators.includes(match.toUpperCase())) {
        indicators.push(match.toUpperCase());
      }
    }
  }

  // Also check for derived values
  const derivedPattern = /(MACD_LINE|MACD_SIGNAL|MACD_HISTOGRAM|BB_UPPER|BB_LOWER|BB_MIDDLE|STOCH_K|STOCH_D)/gi;
  const derivedMatches = equation.match(derivedPattern);
  
  if (derivedMatches) {
    for (const match of derivedMatches) {
      if (!indicators.includes(match.toUpperCase())) {
        indicators.push(match.toUpperCase());
      }
    }
  }

  return indicators;
}

// Parse variables from equation (client-side quick parse)
export function parseVariables(equation: string): string[] {
  const variables: string[] = [];
  const knownVars = ["OPEN", "HIGH", "LOW", "CLOSE", "VOLUME"];
  
  for (const v of knownVars) {
    if (equation.toUpperCase().includes(v)) {
      variables.push(v);
    }
  }

  return variables;
}
