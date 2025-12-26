import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  position?: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
}

interface GuidedTourProps {
  steps: TourStep[];
  tourKey: string; // Unique key for localStorage
  onComplete?: () => void;
  onSkip?: () => void;
}

export const GuidedTour = ({ steps, tourKey, onComplete, onSkip }: GuidedTourProps) => {
  const { isRTL } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<"top" | "bottom" | "left" | "right">("bottom");

  const step = steps[currentStep];
  const hasCompleted = localStorage.getItem(`tour_${tourKey}_completed`) === "true";

  useEffect(() => {
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted]);

  const calculatePosition = useCallback(() => {
    if (!step) return;

    const targetEl = document.querySelector(step.target);
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const padding = 16;
    const arrowOffset = 12;

    let top = 0;
    let left = 0;
    let arrow: "top" | "bottom" | "left" | "right" = "top";

    const preferredPosition = step.position || "bottom";

    switch (preferredPosition) {
      case "bottom":
        top = rect.bottom + arrowOffset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = "top";
        break;
      case "top":
        top = rect.top - tooltipHeight - arrowOffset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrow = "bottom";
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - arrowOffset;
        arrow = "right";
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + arrowOffset;
        arrow = "left";
        break;
    }

    // Keep tooltip in viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ top, left });
    setArrowPosition(arrow);

    // Highlight target element
    if (step.highlight !== false) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("tour-highlight");
    }
  }, [step]);

  useEffect(() => {
    if (isVisible && step) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition);

      return () => {
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition);
        
        // Remove highlight from previous target
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
          targetEl.classList.remove("tour-highlight");
        }
      };
    }
  }, [isVisible, step, calculatePosition]);

  const handleNext = () => {
    // Remove highlight from current target
    const currentTarget = document.querySelector(step.target);
    if (currentTarget) {
      currentTarget.classList.remove("tour-highlight");
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    const currentTarget = document.querySelector(step.target);
    if (currentTarget) {
      currentTarget.classList.remove("tour-highlight");
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`tour_${tourKey}_completed`, "true");
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_${tourKey}_completed`, "true");
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || hasCompleted || !step) return null;

  const title = isRTL ? step.titleAr : step.title;
  const description = isRTL ? step.descriptionAr : step.description;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={handleSkip}
      />

      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-[101] w-80 animate-scale-in",
          isRTL && "text-right"
        )}
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
      >
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-3 h-3 bg-card border-2 border-primary rotate-45",
            arrowPosition === "top" && "top-[-7px] left-1/2 -translate-x-1/2 border-b-0 border-r-0",
            arrowPosition === "bottom" && "bottom-[-7px] left-1/2 -translate-x-1/2 border-t-0 border-l-0",
            arrowPosition === "left" && "left-[-7px] top-1/2 -translate-y-1/2 border-t-0 border-r-0",
            arrowPosition === "right" && "right-[-7px] top-1/2 -translate-y-1/2 border-b-0 border-l-0"
          )}
        />

        {/* Card */}
        <div className="bg-card border-2 border-primary shadow-2xl shadow-primary/20 overflow-hidden">
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {isRTL ? "الجولة التعريفية" : "Guided Tour"}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-1.5 pt-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    idx === currentStep
                      ? "bg-primary"
                      : idx < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className={cn(
              "flex items-center justify-between pt-2",
              isRTL && "flex-row-reverse"
            )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                {isRTL ? "تخطي" : "Skip"}
              </Button>

              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="gap-1 border-2"
                  >
                    {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    {isRTL ? "السابق" : "Back"}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1 border-2"
                >
                  {currentStep === steps.length - 1 
                    ? (isRTL ? "إنهاء" : "Finish") 
                    : (isRTL ? "التالي" : "Next")}
                  {currentStep < steps.length - 1 && (
                    isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for highlighted elements */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 101;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.2);
          border-radius: 4px;
          animation: tour-pulse 2s infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.2);
          }
          50% {
            box-shadow: 0 0 0 8px hsl(var(--primary) / 0.2), 0 0 30px hsl(var(--primary) / 0.3);
          }
        }
      `}</style>
    </>
  );
};

// Hook to reset tour (for testing or user preference)
export const useResetTour = (tourKey: string) => {
  return useCallback(() => {
    localStorage.removeItem(`tour_${tourKey}_completed`);
  }, [tourKey]);
};

// Start tour button component
interface StartTourButtonProps {
  tourKey: string;
  onStart: () => void;
  className?: string;
}

export const StartTourButton = ({ tourKey, onStart, className }: StartTourButtonProps) => {
  const { isRTL } = useLanguage();
  
  const handleStart = () => {
    localStorage.removeItem(`tour_${tourKey}_completed`);
    onStart();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleStart}
      className={cn("gap-2 border-2", className)}
    >
      <Sparkles className="h-4 w-4" />
      {isRTL ? "ابدأ الجولة" : "Start Tour"}
    </Button>
  );
};
