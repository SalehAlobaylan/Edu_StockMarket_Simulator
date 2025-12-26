import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Technical indicator calculations
function calculateSMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function calculateEMA(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    } else {
      const prevEma = result[i - 1] as number;
      result.push((prices[i] - prevEma) * multiplier + prevEma);
    }
  }
  return result;
}

function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      result.push(null);
      continue;
    }

    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);

    if (i < period) {
      result.push(null);
      continue;
    }

    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - (100 / (1 + rs)));
    }
  }
  return result;
}

function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEma = calculateEMA(prices, fastPeriod);
  const slowEma = calculateEMA(prices, slowPeriod);
  
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEma[i] === null || slowEma[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push((fastEma[i] as number) - (slowEma[i] as number));
    }
  }

  const validMacd = macdLine.filter(v => v !== null) as number[];
  const signalEma = calculateEMA(validMacd, signalPeriod);
  
  const signal: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let signalIdx = 0;
  
  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] === null) {
      signal.push(null);
      histogram.push(null);
    } else {
      const signalVal = signalEma[signalIdx] ?? null;
      signal.push(signalVal);
      if (signalVal !== null) {
        histogram.push((macdLine[i] as number) - signalVal);
      } else {
        histogram.push(null);
      }
      signalIdx++;
    }
  }

  return { macd: macdLine, signal, histogram };
}

function calculateBollingerBands(prices: number[], period = 20, stdDev = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const sma = calculateSMA(prices, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i] as number;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { upper, middle: sma, lower };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): (number | null)[] {
  const trueRanges: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
    } else {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
  }

  return calculateSMA(trueRanges, period);
}

// Calculate Stochastic Oscillator
function calculateStochastic(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  kPeriod = 14, 
  dPeriod = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const kValues: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(null);
    } else {
      const highSlice = highs.slice(i - kPeriod + 1, i + 1);
      const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
      const highestHigh = Math.max(...highSlice);
      const lowestLow = Math.min(...lowSlice);
      
      if (highestHigh === lowestLow) {
        kValues.push(50); // Avoid division by zero
      } else {
        const k = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
      }
    }
  }
  
  // Calculate %D as SMA of %K
  const dValues: (number | null)[] = [];
  const validK = kValues.filter(v => v !== null) as number[];
  const dSma = calculateSMA(validK, dPeriod);
  
  let dIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (kValues[i] === null) {
      dValues.push(null);
    } else {
      dValues.push(dSma[dIdx] ?? null);
      dIdx++;
    }
  }
  
  return { k: kValues, d: dValues };
}

// Calculate Average Directional Index (ADX)
function calculateADX(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period = 14
): (number | null)[] {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      tr.push(highs[i] - lows[i]);
    } else {
      // Calculate +DM and -DM
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      
      if (upMove > downMove && upMove > 0) {
        plusDM.push(upMove);
      } else {
        plusDM.push(0);
      }
      
      if (downMove > upMove && downMove > 0) {
        minusDM.push(downMove);
      } else {
        minusDM.push(0);
      }
      
      // True Range
      const trValue = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      tr.push(trValue);
    }
  }
  
  // Smooth the values using Wilder's smoothing (similar to EMA)
  const smoothPlusDM = calculateEMA(plusDM, period);
  const smoothMinusDM = calculateEMA(minusDM, period);
  const smoothTR = calculateEMA(tr, period);
  
  const adxValues: (number | null)[] = [];
  const dx: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (smoothTR[i] === null || smoothPlusDM[i] === null || smoothMinusDM[i] === null || smoothTR[i] === 0) {
      dx.push(null);
    } else {
      const plusDI = (smoothPlusDM[i]! / smoothTR[i]!) * 100;
      const minusDI = (smoothMinusDM[i]! / smoothTR[i]!) * 100;
      const diSum = plusDI + minusDI;
      
      if (diSum === 0) {
        dx.push(0);
      } else {
        dx.push((Math.abs(plusDI - minusDI) / diSum) * 100);
      }
    }
  }
  
  // ADX is the smoothed average of DX
  const validDX = dx.filter(v => v !== null) as number[];
  const adxSmooth = calculateEMA(validDX, period);
  
  let adxIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (dx[i] === null) {
      adxValues.push(null);
    } else {
      adxValues.push(adxSmooth[adxIdx] ?? null);
      adxIdx++;
    }
  }
  
  return adxValues;
}

// Token types for the safe expression parser
type TokenType = 'NUMBER' | 'OPERATOR' | 'COMPARISON' | 'LOGICAL' | 'LPAREN' | 'RPAREN' | 'NOT';

interface Token {
  type: TokenType;
  value: string | number;
}

// Safe tokenizer with strict allow-list
function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < expr.length) {
    const char = expr[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Numbers (including decimals and negative)
    if (/[\d.]/.test(char) || (char === '-' && i + 1 < expr.length && /[\d.]/.test(expr[i + 1]) && (tokens.length === 0 || tokens[tokens.length - 1].type !== 'NUMBER'))) {
      let num = '';
      if (char === '-') {
        num = '-';
        i++;
      }
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return null; // Invalid number
      tokens.push({ type: 'NUMBER', value: parsed });
      continue;
    }
    
    // Two-character operators
    if (i + 1 < expr.length) {
      const twoChar = expr.slice(i, i + 2);
      if (['>=', '<=', '==', '!=', '&&', '||'].includes(twoChar)) {
        if (twoChar === '&&' || twoChar === '||') {
          tokens.push({ type: 'LOGICAL', value: twoChar });
        } else {
          tokens.push({ type: 'COMPARISON', value: twoChar });
        }
        i += 2;
        continue;
      }
    }
    
    // Single character operators
    if (['>', '<'].includes(char)) {
      tokens.push({ type: 'COMPARISON', value: char });
      i++;
      continue;
    }
    
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }
    
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    
    if (char === '!') {
      tokens.push({ type: 'NOT', value: '!' });
      i++;
      continue;
    }
    
    // Unknown character - reject the expression
    console.error(`Unknown character in expression: "${char}" at position ${i}`);
    return null;
  }
  
  return tokens;
}

// Safe recursive descent parser and evaluator
function safeEvaluateExpression(tokens: Token[]): boolean | number | null {
  let pos = 0;
  
  function peek(): Token | undefined {
    return tokens[pos];
  }
  
  function consume(): Token {
    return tokens[pos++];
  }
  
  // Parse OR expressions (lowest precedence)
  function parseOr(): boolean | number | null {
    let left = parseAnd();
    if (left === null) return null;
    
    while (peek()?.type === 'LOGICAL' && peek()?.value === '||') {
      consume();
      const right = parseAnd();
      if (right === null) return null;
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }
  
  // Parse AND expressions
  function parseAnd(): boolean | number | null {
    let left = parseComparison();
    if (left === null) return null;
    
    while (peek()?.type === 'LOGICAL' && peek()?.value === '&&') {
      consume();
      const right = parseComparison();
      if (right === null) return null;
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }
  
  // Parse comparison expressions
  function parseComparison(): boolean | number | null {
    let left: boolean | number | null = parseAddSub();
    if (left === null) return null;
    
    while (peek()?.type === 'COMPARISON') {
      const op = consume().value as string;
      const right = parseAddSub();
      if (right === null) return null;
      
      const leftNum: number = Number(left);
      const rightNum: number = Number(right);
      
      switch (op) {
        case '>': left = leftNum > rightNum; break;
        case '<': left = leftNum < rightNum; break;
        case '>=': left = leftNum >= rightNum; break;
        case '<=': left = leftNum <= rightNum; break;
        case '==': left = leftNum === rightNum; break;
        case '!=': left = leftNum !== rightNum; break;
        default: return null;
      }
    }
    return left;
  }
  
  // Parse addition and subtraction
  function parseAddSub(): boolean | number | null {
    let left = parseMulDiv();
    if (left === null) return null;
    
    while (peek()?.type === 'OPERATOR' && (peek()?.value === '+' || peek()?.value === '-')) {
      const op = consume().value as string;
      const right = parseMulDiv();
      if (right === null) return null;
      
      left = op === '+' ? Number(left) + Number(right) : Number(left) - Number(right);
    }
    return left;
  }
  
  // Parse multiplication and division
  function parseMulDiv(): boolean | number | null {
    let left = parseUnary();
    if (left === null) return null;
    
    while (peek()?.type === 'OPERATOR' && (peek()?.value === '*' || peek()?.value === '/')) {
      const op = consume().value as string;
      const right = parseUnary();
      if (right === null) return null;
      
      if (op === '/' && Number(right) === 0) {
        return null; // Division by zero
      }
      left = op === '*' ? Number(left) * Number(right) : Number(left) / Number(right);
    }
    return left;
  }
  
  // Parse unary operators (NOT)
  function parseUnary(): boolean | number | null {
    if (peek()?.type === 'NOT') {
      consume();
      const val = parseUnary();
      if (val === null) return null;
      return !Boolean(val);
    }
    return parsePrimary();
  }
  
  // Parse primary values (numbers and parentheses)
  function parsePrimary(): boolean | number | null {
    const token = peek();
    
    if (!token) return null;
    
    if (token.type === 'NUMBER') {
      consume();
      return token.value as number;
    }
    
    if (token.type === 'LPAREN') {
      consume();
      const result = parseOr();
      if (result === null) return null;
      if (peek()?.type !== 'RPAREN') return null;
      consume();
      return result;
    }
    
    return null;
  }
  
  const result = parseOr();
  
  // Ensure all tokens were consumed
  if (pos !== tokens.length) {
    return null;
  }
  
  return result;
}

// Parse and evaluate strategy equations SAFELY without using Function() constructor
function evaluateCondition(
  condition: string,
  data: {
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    sma: { [key: number]: number | null };
    ema: { [key: number]: number | null };
    rsi: number | null;
    macd: { macd: number | null; signal: number | null };
    bb: { upper: number | null; lower: number | null; middle: number | null };
    atr: number | null;
    stochastic: { k: number | null; d: number | null };
    adx: number | null;
  }
): boolean {
  try {
    let expr = condition.toUpperCase();
    
    // Replace variables with actual values
    expr = expr.replace(/CLOSE/g, String(data.close));
    expr = expr.replace(/OPEN/g, String(data.open));
    expr = expr.replace(/HIGH/g, String(data.high));
    expr = expr.replace(/LOW/g, String(data.low));
    expr = expr.replace(/VOLUME/g, String(data.volume));
    
    // Replace SMA(n) with values
    expr = expr.replace(/SMA\((\d+)\)/g, (_, period) => {
      const val = data.sma[parseInt(period)];
      return val !== null ? String(val) : 'null';
    });
    
    // Replace EMA(n) with values
    expr = expr.replace(/EMA\((\d+)\)/g, (_, period) => {
      const val = data.ema[parseInt(period)];
      return val !== null ? String(val) : 'null';
    });
    
    // Replace RSI(n) with values
    expr = expr.replace(/RSI\(\d+\)/g, () => {
      return data.rsi !== null ? String(data.rsi) : 'null';
    });
    
    // Replace MACD components
    expr = expr.replace(/MACD_LINE/g, data.macd.macd !== null ? String(data.macd.macd) : 'null');
    expr = expr.replace(/MACD_SIGNAL/g, data.macd.signal !== null ? String(data.macd.signal) : 'null');
    
    // Replace Bollinger Bands
    expr = expr.replace(/BB_UPPER/g, data.bb.upper !== null ? String(data.bb.upper) : 'null');
    expr = expr.replace(/BB_LOWER/g, data.bb.lower !== null ? String(data.bb.lower) : 'null');
    expr = expr.replace(/BB_MIDDLE/g, data.bb.middle !== null ? String(data.bb.middle) : 'null');
    
    // Replace ATR
    expr = expr.replace(/ATR\(\d+\)/g, data.atr !== null ? String(data.atr) : 'null');
    
    // Replace Stochastic
    expr = expr.replace(/STOCH_K/g, data.stochastic.k !== null ? String(data.stochastic.k) : 'null');
    expr = expr.replace(/STOCH_D/g, data.stochastic.d !== null ? String(data.stochastic.d) : 'null');
    expr = expr.replace(/STOCHASTIC\([^)]*\)/g, data.stochastic.k !== null ? String(data.stochastic.k) : 'null');
    
    // Replace ADX
    expr = expr.replace(/ADX\(\d+\)/g, data.adx !== null ? String(data.adx) : 'null');
    expr = expr.replace(/\bADX\b/g, data.adx !== null ? String(data.adx) : 'null');
    
    // Handle logical operators - convert to symbols for parsing
    expr = expr.replace(/\bAND\b/g, '&&');
    expr = expr.replace(/\bOR\b/g, '||');
    expr = expr.replace(/\bNOT\b/g, '!');
    
    // If any null values remain, condition is false
    if (expr.includes('null')) {
      return false;
    }
    
    // Tokenize and safely evaluate using the parser (NOT Function() constructor)
    const tokens = tokenize(expr);
    if (tokens === null) {
      console.error('Failed to tokenize expression:', expr);
      return false;
    }
    
    if (tokens.length === 0) {
      return false;
    }
    
    const result = safeEvaluateExpression(tokens);
    if (result === null) {
      console.error('Failed to evaluate expression:', expr);
      return false;
    }
    
    return Boolean(result);
  } catch (error) {
    console.error('Error evaluating condition:', condition, error);
    return false;
  }
}

interface BacktestResult {
  dates: string[];
  equity: number[];
  trades: Array<{
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    quantity: number;
    value: number;
    commission: number;
    pnl?: number;
    exitReason?: 'signal' | 'stop_loss' | 'take_profit' | 'trailing_stop';
  }>;
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    cagr: number;
    numTrades: number;
    stopLossHits: number;
    takeProfitHits: number;
    trailingStopHits: number;
  };
}

function runBacktest(
  candles: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>,
  entryLogic: string,
  exitLogic: string,
  initialCapital: number,
  commissionPct: number,
  slippageBps: number,
  maxPositionPct: number,
  stopLossPct: number | null = null,
  takeProfitPct: number | null = null,
  trailingStopPct: number | null = null
): BacktestResult {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // Pre-calculate indicators
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const rsi14 = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes);
  const atr = calculateATR(highs, lows, closes);
  const stochastic = calculateStochastic(highs, lows, closes);
  const adx = calculateADX(highs, lows, closes);
  
  // Backtest state
  let cash = initialCapital;
  let position = 0;
  let entryPrice = 0;
  let highestPriceSinceEntry = 0; // Track highest price for trailing stop
  const dates: string[] = [];
  const equity: number[] = [];
  const trades: BacktestResult['trades'] = [];
  let stopLossHits = 0;
  let takeProfitHits = 0;
  let trailingStopHits = 0;
  
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    
    const indicatorData = {
      close: candle.close,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      volume: candle.volume,
      sma: { 20: sma20[i], 50: sma50[i], 200: sma200[i] },
      ema: { 12: ema12[i], 26: ema26[i] },
      rsi: rsi14[i],
      macd: { macd: macd.macd[i], signal: macd.signal[i] },
      bb: { upper: bb.upper[i], lower: bb.lower[i], middle: bb.middle[i] },
      atr: atr[i],
      stochastic: { k: stochastic.k[i], d: stochastic.d[i] },
      adx: adx[i],
    };
    
    // Check entry condition
    if (position === 0 && evaluateCondition(entryLogic, indicatorData)) {
      // Calculate position size
      const maxValue = cash * (maxPositionPct / 100);
      const slippage = candle.close * (slippageBps / 10000);
      const buyPrice = candle.close + slippage;
      const shares = Math.floor(maxValue / buyPrice);
      
      if (shares > 0) {
        const commission = shares * buyPrice * (commissionPct / 100);
        const totalCost = shares * buyPrice + commission;
        
        if (totalCost <= cash) {
          cash -= totalCost;
          position = shares;
          entryPrice = buyPrice;
          
          trades.push({
            date: candle.date,
            type: 'BUY',
            price: buyPrice,
            quantity: shares,
            value: shares * buyPrice,
            commission,
          });
        }
      }
    }
    
    // Check exit conditions (stop-loss, take-profit, trailing stop, or signal)
    if (position > 0) {
      // Update highest price since entry for trailing stop
      highestPriceSinceEntry = Math.max(highestPriceSinceEntry, candle.high);
      
      let shouldExit = false;
      let exitReason: 'signal' | 'stop_loss' | 'take_profit' | 'trailing_stop' = 'signal';
      let exitPrice = candle.close;
      
      // Check fixed stop-loss (using low price for intraday trigger)
      if (stopLossPct !== null && stopLossPct > 0) {
        const stopLossPrice = entryPrice * (1 - stopLossPct / 100);
        if (candle.low <= stopLossPrice) {
          shouldExit = true;
          exitReason = 'stop_loss';
          exitPrice = stopLossPrice;
          stopLossHits++;
          console.log(`Stop-loss triggered at ${candle.date}: entry=${entryPrice.toFixed(2)}, stop=${stopLossPrice.toFixed(2)}`);
        }
      }
      
      // Check trailing stop-loss (dynamic stop based on highest price since entry)
      if (!shouldExit && trailingStopPct !== null && trailingStopPct > 0) {
        const trailingStopPrice = highestPriceSinceEntry * (1 - trailingStopPct / 100);
        // Only trigger if we're actually trailing (stop price is above entry price)
        if (candle.low <= trailingStopPrice) {
          shouldExit = true;
          exitReason = 'trailing_stop';
          exitPrice = trailingStopPrice;
          trailingStopHits++;
          console.log(`Trailing stop triggered at ${candle.date}: entry=${entryPrice.toFixed(2)}, peak=${highestPriceSinceEntry.toFixed(2)}, trailStop=${trailingStopPrice.toFixed(2)}`);
        }
      }
      
      // Check take-profit (using high price for intraday trigger)
      if (!shouldExit && takeProfitPct !== null && takeProfitPct > 0) {
        const takeProfitPrice = entryPrice * (1 + takeProfitPct / 100);
        if (candle.high >= takeProfitPrice) {
          shouldExit = true;
          exitReason = 'take_profit';
          exitPrice = takeProfitPrice;
          takeProfitHits++;
          console.log(`Take-profit triggered at ${candle.date}: entry=${entryPrice.toFixed(2)}, target=${takeProfitPrice.toFixed(2)}`);
        }
      }
      
      // Check strategy exit signal
      if (!shouldExit && evaluateCondition(exitLogic, indicatorData)) {
        shouldExit = true;
        exitReason = 'signal';
        exitPrice = candle.close;
      }
      
      if (shouldExit) {
        const slippage = exitPrice * (slippageBps / 10000);
        const sellPrice = exitPrice - slippage;
        const proceeds = position * sellPrice;
        const commission = proceeds * (commissionPct / 100);
        const netProceeds = proceeds - commission;
        const pnl = netProceeds - (position * entryPrice);
        
        cash += netProceeds;
        
        trades.push({
          date: candle.date,
          type: 'SELL',
          price: sellPrice,
          quantity: position,
          value: proceeds,
          commission,
          pnl,
          exitReason,
        });
        
        position = 0;
        entryPrice = 0;
        highestPriceSinceEntry = 0; // Reset trailing stop tracker
      }
    }
    
    // Calculate equity
    const currentEquity = cash + position * candle.close;
    dates.push(candle.date);
    equity.push(currentEquity);
  }
  
  // Calculate metrics
  const finalEquity = equity[equity.length - 1];
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
  
  // Calculate Sharpe Ratio
  const dailyReturns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    dailyReturns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
  }
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  // Calculate Max Drawdown
  let peak = equity[0];
  let maxDrawdown = 0;
  for (const eq of equity) {
    if (eq > peak) peak = eq;
    const drawdown = ((peak - eq) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Calculate Win Rate
  const sellTrades = trades.filter(t => t.type === 'SELL');
  const winningTrades = sellTrades.filter(t => (t.pnl || 0) > 0);
  const winRate = sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0;
  
  // Calculate CAGR
  const years = candles.length / 252;
  const cagr = years > 0 ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100 : 0;
  
  return {
    dates,
    equity,
    trades,
    metrics: {
      totalReturn: Math.round(totalReturn * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      cagr: Math.round(cagr * 100) / 100,
      numTrades: trades.length,
      stopLossHits,
      takeProfitHits,
      trailingStopHits,
    },
  };
}

// Generate mock market data (since we don't have real API connection yet)
function generateMockCandles(ticker: string, startDate: string, endDate: string): Array<{
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> {
  const candles = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Initial price based on ticker
  let price = ticker === 'TASI' ? 12000 : 
              ticker === '2222' ? 29 : 
              ticker === '1180' ? 78 : 
              ticker === '2010' ? 92 : 40;
  
  const current = new Date(start);
  while (current <= end) {
    // Skip weekends
    const day = current.getDay();
    if (day !== 5 && day !== 6) { // Saudi weekends are Fri-Sat
      const change = (Math.random() - 0.48) * (price * 0.03);
      const open = price;
      price = price + change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.01);
      const low = Math.min(open, price) * (1 - Math.random() * 0.01);
      const volume = Math.floor(1000000 + Math.random() * 5000000);
      
      candles.push({
        date: current.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(price * 100) / 100,
        volume,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return candles;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      name,
      ticker,
      startDate,
      endDate,
      initialCapital = 100000,
      commissionPct = 0.1,
      slippageBps = 5,
      maxPositionPct = 10,
      stopLossPct = null,
      takeProfitPct = null,
      trailingStopPct = null,
      strategyId,
      entryLogic,
      exitLogic,
    } = body;

    console.log('Running simulation:', { name, ticker, startDate, endDate, stopLossPct, takeProfitPct, trailingStopPct });

    // Get strategy if strategyId provided
    let entry = entryLogic;
    let exit = exitLogic;
    
    if (strategyId) {
      const { data: strategy, error: strategyError } = await supabase
        .from('strategies')
        .select('entry_logic, exit_logic')
        .eq('id', strategyId)
        .single();
      
      if (strategyError || !strategy) {
        return new Response(JSON.stringify({ error: 'Strategy not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      entry = strategy.entry_logic;
      exit = strategy.exit_logic;
    }

    if (!entry || !exit) {
      return new Response(JSON.stringify({ error: 'Entry and exit logic required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create simulation record with pending status
    const { data: simulation, error: insertError } = await supabase
      .from('simulations')
      .insert({
        user_id: user.id,
        name: name || `${ticker} Simulation`,
        ticker,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital,
        commission_pct: commissionPct,
        slippage_bps: slippageBps,
        max_position_pct: maxPositionPct,
        strategy_id: strategyId || null,
        status: 'running',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create simulation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to fetch real market data from database first
    let candles: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> = [];
    
    // Get asset ID
    const { data: asset } = await supabase
      .from('assets')
      .select('id')
      .eq('ticker', ticker)
      .single();

    if (asset) {
      // Fetch from market_candles table
      const { data: dbCandles, error: candlesError } = await supabase
        .from('market_candles')
        .select('*')
        .eq('asset_id', asset.id)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: true });

      if (!candlesError && dbCandles && dbCandles.length > 0) {
        console.log(`Found ${dbCandles.length} candles in database for ${ticker}`);
        candles = dbCandles.map(c => ({
          date: c.timestamp.split('T')[0],
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume ?? 0,
        }));
      }
    }

    // Fall back to mock data if no real data available
    if (candles.length === 0) {
      console.log(`No market data found for ${ticker}, generating mock data`);
      candles = generateMockCandles(ticker, startDate, endDate);
    }
    
    console.log(`Using ${candles.length} candles for backtest`);

    // Run the backtest with stop-loss, take-profit, and trailing stop
    const result = runBacktest(
      candles,
      entry,
      exit,
      initialCapital,
      commissionPct,
      slippageBps,
      maxPositionPct,
      stopLossPct,
      takeProfitPct,
      trailingStopPct
    );

    console.log('Backtest complete:', result.metrics);

    // Update simulation with results
    const { error: updateError } = await supabase
      .from('simulations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_return_pct: result.metrics.totalReturn,
        sharpe_ratio: result.metrics.sharpeRatio,
        max_drawdown_pct: result.metrics.maxDrawdown,
        win_rate_pct: result.metrics.winRate,
        cagr_pct: result.metrics.cagr,
        num_trades: result.metrics.numTrades,
        result_data: result,
      })
      .eq('id', simulation.id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return new Response(JSON.stringify({
      id: simulation.id,
      ...result.metrics,
      result: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in run-simulation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
