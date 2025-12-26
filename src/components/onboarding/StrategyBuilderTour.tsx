import { GuidedTour, TourStep } from "./GuidedTour";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const strategyBuilderSteps: TourStep[] = [
  {
    target: "[data-tour='strategy-info']",
    title: "Strategy Information",
    titleAr: "معلومات الاستراتيجية",
    description: "Start by naming your strategy and optionally loading a pre-built template to get started quickly.",
    descriptionAr: "ابدأ بتسمية استراتيجيتك واختيارياً تحميل قالب جاهز للبدء بسرعة.",
    position: "bottom",
  },
  {
    target: "[data-tour='entry-signal']",
    title: "Entry Signal (Buy)",
    titleAr: "إشارة الدخول (شراء)",
    description: "Define when to buy using technical indicators like RSI, SMA, MACD. Example: RSI(14) < 30 means buy when RSI drops below 30.",
    descriptionAr: "حدد متى تشتري باستخدام المؤشرات الفنية مثل RSI و SMA و MACD. مثال: RSI(14) < 30 تعني الشراء عندما ينخفض RSI تحت 30.",
    position: "bottom",
  },
  {
    target: "[data-tour='exit-signal']",
    title: "Exit Signal (Sell)",
    titleAr: "إشارة الخروج (بيع)",
    description: "Define when to sell. You can combine multiple conditions using AND/OR operators for more sophisticated strategies.",
    descriptionAr: "حدد متى تبيع. يمكنك دمج شروط متعددة باستخدام عوامل AND/OR لاستراتيجيات أكثر تطوراً.",
    position: "top",
  },
  {
    target: "[data-tour='validate-btn']",
    title: "Validate Your Strategy",
    titleAr: "تحقق من استراتيجيتك",
    description: "Click to validate your equations before saving. This ensures your strategy logic is correct and ready for backtesting.",
    descriptionAr: "انقر للتحقق من معادلاتك قبل الحفظ. هذا يضمن أن منطق استراتيجيتك صحيح وجاهز للاختبار الرجعي.",
    position: "bottom",
  },
  {
    target: "[data-tour='save-btn']",
    title: "Save Your Strategy",
    titleAr: "احفظ استراتيجيتك",
    description: "Save your strategy to use it later in backtesting simulations. You can create multiple strategies and compare their performance.",
    descriptionAr: "احفظ استراتيجيتك لاستخدامها لاحقاً في المحاكاة. يمكنك إنشاء استراتيجيات متعددة ومقارنة أدائها.",
    position: "bottom",
  },
  {
    target: "[data-tour='backtest-btn']",
    title: "Run Backtest",
    titleAr: "تشغيل الاختبار الرجعي",
    description: "Test your strategy against historical data to see how it would have performed. This takes you to the Simulations page.",
    descriptionAr: "اختبر استراتيجيتك على البيانات التاريخية لترى كيف كان أداؤها. هذا ينقلك إلى صفحة المحاكاة.",
    position: "bottom",
  },
  {
    target: "[data-tour='ai-assistant']",
    title: "AI Strategy Assistant",
    titleAr: "مساعد الذكاء الاصطناعي",
    description: "Need help? Ask the AI assistant to generate strategy ideas, explain indicators, or optimize your existing strategies.",
    descriptionAr: "تحتاج مساعدة؟ اسأل مساعد الذكاء الاصطناعي لتوليد أفكار استراتيجية أو شرح المؤشرات أو تحسين استراتيجياتك.",
    position: "left",
  },
  {
    target: "[data-tour='saved-strategies']",
    title: "Your Saved Strategies",
    titleAr: "استراتيجياتك المحفوظة",
    description: "Access all your saved strategies here. Click any strategy to edit it, or create a new one from scratch.",
    descriptionAr: "الوصول إلى جميع استراتيجياتك المحفوظة هنا. انقر على أي استراتيجية لتعديلها أو إنشاء واحدة جديدة.",
    position: "left",
  },
];

interface StrategyBuilderTourProps {
  isActive: boolean;
}

export const StrategyBuilderTour = ({ isActive }: StrategyBuilderTourProps) => {
  const { isRTL } = useLanguage();

  if (!isActive) return null;

  return (
    <GuidedTour
      steps={strategyBuilderSteps}
      tourKey="strategy-builder"
      onComplete={() => {
        toast.success(
          isRTL 
            ? "🎉 أحسنت! أنت الآن جاهز لبناء استراتيجيات احترافية" 
            : "🎉 Great job! You're now ready to build professional strategies"
        );
      }}
    />
  );
};

export const strategyBuilderTourKey = "strategy-builder";
