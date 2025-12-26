import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  LineChart, 
  Target, 
  TrendingUp, 
  ArrowRight,
  ArrowLeft,
  Rocket
} from "lucide-react";

interface WelcomeModalProps {
  onStartTour: () => void;
}

export const WelcomeModal = ({ onStartTour }: WelcomeModalProps) => {
  const { isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const hasSeenWelcome = localStorage.getItem("welcome_modal_seen") === "true";

  useEffect(() => {
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome]);

  const handleStartTour = () => {
    localStorage.setItem("welcome_modal_seen", "true");
    setIsOpen(false);
    onStartTour();
  };

  const handleSkip = () => {
    localStorage.setItem("welcome_modal_seen", "true");
    setIsOpen(false);
  };

  if (hasSeenWelcome) return null;

  const features = [
    {
      icon: Target,
      title: isRTL ? "بناء الاستراتيجيات" : "Build Strategies",
      description: isRTL 
        ? "صمم استراتيجيات التداول باستخدام المؤشرات الفنية"
        : "Design trading strategies using technical indicators",
    },
    {
      icon: LineChart,
      title: isRTL ? "اختبار رجعي" : "Backtest",
      description: isRTL
        ? "اختبر استراتيجياتك على البيانات التاريخية"
        : "Test your strategies on historical data",
    },
    {
      icon: TrendingUp,
      title: isRTL ? "تحليل الأداء" : "Analyze Performance",
      description: isRTL
        ? "راجع المقاييس والرسوم البيانية التفصيلية"
        : "Review detailed metrics and charts",
    },
  ];

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg border-2 border-primary/20 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
          <DialogHeader className={cn(isRTL && "text-right")}>
            <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse")}>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {isRTL ? "مرحباً بك في TASI Simulator" : "Welcome to TASI Simulator"}
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {isRTL 
                    ? "منصتك لبناء واختبار استراتيجيات التداول"
                    : "Your platform for building and testing trading strategies"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Features */}
        <div className="p-6 pt-2 space-y-4">
          <div className="grid gap-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-2 border-border bg-muted/30 hover:bg-muted/50 transition-colors",
                  isRTL && "flex-row-reverse text-right"
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className={cn(
            "flex items-center justify-between pt-4 border-t border-border",
            isRTL && "flex-row-reverse"
          )}>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              {isRTL ? "تخطي" : "Skip for now"}
            </Button>
            <Button
              onClick={handleStartTour}
              className="gap-2 border-2"
            >
              <Sparkles className="h-4 w-4" />
              {isRTL ? "ابدأ الجولة التعريفية" : "Start Guided Tour"}
              <Arrow className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to reset welcome modal (for testing)
export const useResetWelcome = () => {
  return () => {
    localStorage.removeItem("welcome_modal_seen");
    localStorage.removeItem("tour_strategy-builder_completed");
  };
};
