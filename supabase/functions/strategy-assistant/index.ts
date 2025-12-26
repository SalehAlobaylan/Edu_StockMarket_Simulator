import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an expert trading strategy assistant for a backtesting platform. Your role is to help users create and optimize trading strategies using technical indicators.

AVAILABLE INDICATORS AND SYNTAX:
- Variables: OPEN, HIGH, LOW, CLOSE, VOLUME
- Moving Averages: SMA(period), EMA(period)
- Momentum: RSI(period), MACD(fast, slow, signal)
- Volatility: BB_UPPER(period, std), BB_LOWER(period, std), ATR(period)
- Trend: ADX(period)
- Operators: >, <, >=, <=, ==, AND, OR, NOT
- Arithmetic: +, -, *, /

EXAMPLE STRATEGIES:
1. RSI Oversold Entry: RSI(14) < 30
2. Golden Cross Entry: SMA(50) > SMA(200)
3. Bollinger Band Bounce: CLOSE < BB_LOWER(20, 2)
4. MACD Crossover: MACD(12, 26, 9) > 0

GUIDELINES:
- Provide entry and exit logic separately
- Format equations in the exact syntax shown above
- Explain the rationale behind each strategy
- Suggest parameter optimizations when appropriate
- Keep responses concise but informative
- When generating strategies, wrap the entry logic in <entry> tags and exit logic in <exit> tags

When users describe a strategy in plain language, translate it to the equation format. Always validate that your suggested equations use valid syntax.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing strategy assistant request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Strategy assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
