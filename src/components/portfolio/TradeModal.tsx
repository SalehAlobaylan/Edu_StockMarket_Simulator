import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useExecuteTrade } from "@/hooks/usePortfolio";
import { useAssets } from "@/hooks/useAssets";

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "buy" | "sell";
  holdings?: Array<{ ticker: string; name: string; quantity: number; currentPrice: number }>;
  portfolioId?: string;
}

// Generate mock price for now (will be replaced with real API)
function getMockPrice(ticker: string): number {
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 20 + (seed % 80) + Math.random() * 5;
}

export function TradeModal({ open, onOpenChange, type, holdings = [], portfolioId }: TradeModalProps) {
  const { language } = useLanguage();
  const [selectedStock, setSelectedStock] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [limitPrice, setLimitPrice] = useState("");

  const executeTrade = useExecuteTrade();
  const { data: assets = [] } = useAssets();

  const isBuy = type === "buy";
  
  // Create stock list from assets (for buy) or holdings (for sell)
  const stockList = useMemo(() => {
    if (isBuy) {
      return assets
        .filter(a => a.sector !== 'Index')
        .map(a => ({
          ticker: a.ticker,
          name: a.name,
          price: getMockPrice(a.ticker),
        }));
    }
    return holdings.map(h => ({
      ticker: h.ticker,
      name: h.name,
      price: h.currentPrice,
      maxQty: h.quantity,
    }));
  }, [assets, holdings, isBuy]);

  const selectedStockData = stockList.find(s => s.ticker === selectedStock);
  const currentPrice = selectedStockData?.price || 0;
  const maxQuantity = !isBuy && selectedStockData ? (selectedStockData as any).maxQty : Infinity;
  const quantityNum = parseInt(quantity) || 0;
  const estimatedValue = quantityNum * (orderType === "limit" ? parseFloat(limitPrice) || currentPrice : currentPrice);

  const handleSubmit = async () => {
    if (!portfolioId) {
      toast.error("Portfolio not found");
      return;
    }
    if (!selectedStock) {
      toast.error(language === "ar" ? "الرجاء اختيار السهم" : "Please select a stock");
      return;
    }
    if (!quantity || quantityNum <= 0) {
      toast.error(language === "ar" ? "الرجاء إدخال كمية صحيحة" : "Please enter a valid quantity");
      return;
    }
    if (!isBuy && quantityNum > maxQuantity) {
      toast.error(language === "ar" ? "الكمية تتجاوز الحد المتاح" : "Quantity exceeds available holdings");
      return;
    }
    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error(language === "ar" ? "الرجاء إدخال سعر محدد صحيح" : "Please enter a valid limit price");
      return;
    }

    const price = orderType === "limit" ? parseFloat(limitPrice) : currentPrice;
    const stockName = selectedStockData?.name || selectedStock;

    await executeTrade.mutateAsync({
      portfolioId,
      ticker: selectedStock,
      name: stockName,
      type: isBuy ? "BUY" : "SELL",
      quantity: quantityNum,
      price,
    });
    
    // Reset form
    setSelectedStock("");
    setQuantity("");
    setLimitPrice("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBuy ? (
              <TrendingUp className="h-5 w-5 text-profit" />
            ) : (
              <TrendingDown className="h-5 w-5 text-loss" />
            )}
            <span className={cn(isBuy ? "text-profit" : "text-loss")}>
              {isBuy 
                ? (language === "ar" ? "شراء سهم" : "Buy Stock")
                : (language === "ar" ? "بيع سهم" : "Sell Stock")}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Stock Selection */}
          <div className="space-y-2">
            <Label>{language === "ar" ? "السهم" : "Stock"}</Label>
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger className="border-2">
                <SelectValue placeholder={language === "ar" ? "اختر السهم..." : "Select stock..."} />
              </SelectTrigger>
              <SelectContent>
                {stockList.map((stock) => (
                  <SelectItem key={stock.ticker} value={stock.ticker}>
                    <span className="font-mono font-semibold">{stock.ticker}</span>
                    <span className="text-muted-foreground mx-2">-</span>
                    <span>{stock.name}</span>
                    {!isBuy && (
                      <span className="text-muted-foreground ml-2">
                        ({(stock as any).maxQty} {language === "ar" ? "متاح" : "available"})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Price Display */}
          {selectedStock && (
            <div className="border-2 border-border bg-muted/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === "ar" ? "السعر الحالي" : "Current Price"}
                </span>
                <span className="font-mono font-semibold">
                  SAR {currentPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Order Type */}
          <div className="space-y-2">
            <Label>{language === "ar" ? "نوع الأمر" : "Order Type"}</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">
                  {language === "ar" ? "أمر سوق" : "Market Order"}
                </SelectItem>
                <SelectItem value="limit">
                  {language === "ar" ? "أمر محدد" : "Limit Order"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limit Price (if limit order) */}
          {orderType === "limit" && (
            <div className="space-y-2">
              <Label>{language === "ar" ? "السعر المحدد" : "Limit Price"}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">SAR</span>
                <Input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="border-2 font-mono pl-12"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label>{language === "ar" ? "الكمية" : "Quantity"}</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border-2 font-mono"
              placeholder="0"
              min="1"
              max={!isBuy ? maxQuantity : undefined}
            />
            {!isBuy && selectedStockData && (
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "الحد الأقصى المتاح:" : "Max available:"} {maxQuantity}
              </p>
            )}
          </div>

          {/* Estimated Value */}
          {quantityNum > 0 && selectedStock && (
            <div className="border-2 border-border bg-card p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {language === "ar" ? "القيمة المقدرة" : "Estimated Value"}
                </span>
                <span className="text-lg font-bold font-mono">
                  SAR {estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {orderType === "market" && (
                <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    {language === "ar" 
                      ? "أوامر السوق قد تنفذ بسعر مختلف قليلاً"
                      : "Market orders may execute at slightly different price"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-2">
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={executeTrade.isPending}
            className={cn(
              "gap-2 border-2",
              isBuy ? "bg-profit hover:bg-profit/90" : "bg-loss hover:bg-loss/90"
            )}
          >
            {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {executeTrade.isPending
              ? (language === "ar" ? "جاري..." : "Processing...")
              : isBuy 
                ? (language === "ar" ? "تأكيد الشراء" : "Confirm Buy")
                : (language === "ar" ? "تأكيد البيع" : "Confirm Sell")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
