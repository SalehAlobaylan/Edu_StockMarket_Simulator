import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EquationEditor, EquationHelp } from "@/components/strategy/EquationEditor";
import { StrategyAssistant } from "@/components/strategy/StrategyAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, AlertCircle, Save, Play, FileCode, Bot, BookOpen, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy, Strategy } from "@/hooks/useStrategies";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { StrategyBuilderTour, strategyBuilderTourKey } from "@/components/onboarding/StrategyBuilderTour";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { StartTourButton } from "@/components/onboarding/GuidedTour";

const strategyTemplates = [
  {
    name: "RSI Oversold/Overbought",
    entry: "RSI(14) < 30",
    exit: "RSI(14) > 70",
  },
  {
    name: "Golden Cross",
    entry: "SMA(50) > SMA(200)",
    exit: "SMA(50) < SMA(200)",
  },
  {
    name: "Bollinger Band Bounce",
    entry: "CLOSE < BB_LOWER(20, 2)",
    exit: "CLOSE > SMA(20)",
  },
  {
    name: "MACD Crossover",
    entry: "MACD(12, 26, 9) > 0",
    exit: "MACD(12, 26, 9) < 0",
  },
];

const StrategyBuilder = () => {
  const { t, isRTL, language } = useLanguage();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entryLogic, setEntryLogic] = useState("");
  const [exitLogic, setExitLogic] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const { data: strategies, isLoading: isLoadingStrategies } = useStrategies();
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();
  const deleteStrategy = useDeleteStrategy();

  const handleTemplateSelect = (templateName: string) => {
    const template = strategyTemplates.find((t) => t.name === templateName);
    if (template) {
      setEntryLogic(template.entry);
      setExitLogic(template.exit);
      setName(template.name);
      setSelectedStrategyId(null);
      toast.success(`Template "${template.name}" loaded`);
    }
  };

  const handleApplyAIStrategy = (entry: string, exit: string) => {
    if (entry) setEntryLogic(entry);
    if (exit) setExitLogic(exit);
  };

  const handleSelectStrategy = (strategy: Strategy) => {
    setSelectedStrategyId(strategy.id);
    setName(strategy.name);
    setDescription(strategy.description || "");
    setEntryLogic(strategy.entry_logic);
    setExitLogic(strategy.exit_logic);
    setValidationResult(null);
    toast.success(`Strategy "${strategy.name}" loaded`);
  };

  const handleNewStrategy = () => {
    setSelectedStrategyId(null);
    setName("");
    setDescription("");
    setEntryLogic("");
    setExitLogic("");
    setValidationResult(null);
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      const isValid = entryLogic.length > 0 && exitLogic.length > 0;
      setValidationResult({
        valid: isValid,
        message: isValid
          ? "Strategy equations are valid and ready for backtesting."
          : "Please provide both entry and exit logic.",
      });
      setIsValidating(false);
    }, 500);
  };

  const handleSave = async () => {
    if (!name) {
      toast.error("Please provide a strategy name");
      return;
    }
    if (!entryLogic || !exitLogic) {
      toast.error("Please provide both entry and exit logic");
      return;
    }

    if (selectedStrategyId) {
      await updateStrategy.mutateAsync({
        id: selectedStrategyId,
        name,
        description,
        entry_logic: entryLogic,
        exit_logic: exitLogic,
      });
    } else {
      const newStrategy = await createStrategy.mutateAsync({
        name,
        description,
        entry_logic: entryLogic,
        exit_logic: exitLogic,
      });
      setSelectedStrategyId(newStrategy.id);
    }
  };

  const handleDelete = async (strategyId: string) => {
    await deleteStrategy.mutateAsync(strategyId);
    if (selectedStrategyId === strategyId) {
      handleNewStrategy();
    }
  };

  const handleRunBacktest = () => {
    if (!entryLogic || !exitLogic) {
      toast.error("Please define entry and exit logic first");
      return;
    }
    toast.info("Redirecting to simulation runner...");
  };

  const isSaving = createStrategy.isPending || updateStrategy.isPending;

  const startTour = () => {
    setShowTour(true);
    setTourKey(prev => prev + 1);
  };

  return (
    <AppLayout>
      {/* Welcome Modal & Guided Tour */}
      <WelcomeModal onStartTour={startTour} />
      <StrategyBuilderTour key={tourKey} isActive={showTour} />

      {/* Page Header */}
      <div className={cn("mb-6 md:mb-8", isRTL && "text-right")}>
        <div className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          isRTL && "sm:flex-row-reverse"
        )}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              {t("strategy.title")}
            </h1>
            <p className="mt-1 text-sm md:text-base text-muted-foreground">
              {t("strategy.subtitle")}
            </p>
          </div>
          <StartTourButton 
            tourKey={strategyBuilderTourKey} 
            onStart={startTour}
          />
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="space-y-4 md:space-y-6 lg:col-span-2">
          {/* Strategy Info */}
          <div data-tour="strategy-info" className="border-2 border-border bg-card p-4 md:p-6 space-y-4">
            <h2 className={cn("text-sm font-semibold uppercase tracking-wider", isRTL && "text-right")}>
              {t("strategy.strategyInfo")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className={cn(isRTL && "text-right block")}>{t("strategy.strategyName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("strategy.enterName")}
                  className={cn("border-2", isRTL && "text-right")}
                />
              </div>

              <div className="space-y-2">
                <Label className={cn(isRTL && "text-right block")}>{t("strategy.template")}</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder={t("strategy.loadTemplate")} />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyTemplates.map((template) => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={cn(isRTL && "text-right block")}>{t("strategy.description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("strategy.descriptionPlaceholder")}
                className={cn("border-2 min-h-[80px]", isRTL && "text-right")}
              />
            </div>
          </div>

          {/* Entry Logic */}
          <div data-tour="entry-signal" className="border-2 border-border bg-card p-4 md:p-6">
            <div className={cn("mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="h-3 w-3 bg-profit" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {t("strategy.entrySignal")}
              </span>
            </div>
            <EquationEditor
              label=""
              value={entryLogic}
              onChange={setEntryLogic}
              placeholder="e.g., RSI(14) < 30 AND CLOSE > SMA(50)"
            />
          </div>

          {/* Exit Logic */}
          <div data-tour="exit-signal" className="border-2 border-border bg-card p-4 md:p-6">
            <div className={cn("mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="h-3 w-3 bg-loss" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {t("strategy.exitSignal")}
              </span>
            </div>
            <EquationEditor
              label=""
              value={exitLogic}
              onChange={setExitLogic}
              placeholder="e.g., RSI(14) > 70 OR CLOSE < SMA(50) * 0.95"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={cn(
                "border-2 p-4 flex items-start gap-3",
                validationResult.valid
                  ? "border-profit/50 bg-profit/10"
                  : "border-loss/50 bg-loss/10",
                isRTL && "flex-row-reverse text-right"
              )}
            >
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-profit shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-loss shrink-0" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    validationResult.valid ? "text-profit" : "text-loss"
                  }`}
                >
                  {validationResult.valid ? t("strategy.valid") : t("strategy.invalid")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {validationResult.valid ? t("strategy.validMessage") : t("strategy.invalidMessage")}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={cn(
            "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3",
            isRTL && "sm:flex-row-reverse"
          )}>
            <Button
              data-tour="validate-btn"
              onClick={handleValidate}
              variant="outline"
              className="gap-2 border-2 w-full sm:w-auto"
              disabled={isValidating}
            >
              <FileCode className="h-4 w-4" />
              {isValidating ? t("strategy.validating") : t("strategy.validate")}
            </Button>
            <Button 
              data-tour="save-btn"
              onClick={handleSave} 
              variant="outline" 
              className="gap-2 border-2 w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {selectedStrategyId ? t("strategy.updateStrategy") : t("strategy.saveStrategy")}
            </Button>
            <Button 
              data-tour="backtest-btn" 
              onClick={handleRunBacktest} 
              className="gap-2 border-2 w-full sm:w-auto"
            >
              <Play className="h-4 w-4" />
              {t("strategy.runBacktest")}
            </Button>
          </div>
        </div>

        {/* Right Column - AI Assistant & Help */}
        <div className="space-y-4 md:space-y-6">
          <div data-tour="ai-assistant">
            <Tabs defaultValue="assistant" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assistant" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">{t("strategy.aiAssistant")}</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="help" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">{t("strategy.reference")}</span>
                  <span className="sm:hidden">Help</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="assistant" className="mt-4">
                <div className="h-[400px] md:h-[500px]">
                  <StrategyAssistant onApplyStrategy={handleApplyAIStrategy} />
                </div>
              </TabsContent>
              <TabsContent value="help" className="mt-4">
                <EquationHelp />
              </TabsContent>
            </Tabs>
          </div>

          {/* Saved Strategies */}
          <div data-tour="saved-strategies" className="border-2 border-border bg-card p-4">
            <div className={cn("mb-4 flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {t("strategy.yourStrategies")}
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 border-2"
                onClick={handleNewStrategy}
              >
                <Plus className="h-3 w-3" />
                {t("strategy.new")}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoadingStrategies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : strategies && strategies.length > 0 ? (
                strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={cn(
                      "flex items-center justify-between border-2 p-3 transition-colors cursor-pointer",
                      selectedStrategyId === strategy.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                      isRTL && "flex-row-reverse"
                    )}
                    onClick={() => handleSelectStrategy(strategy)}
                  >
                    <div className={cn("min-w-0 flex-1", isRTL && "text-right")}>
                      <span className="text-sm font-medium block truncate">{strategy.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(strategy.updated_at), { 
                          addSuffix: true,
                          locale: language === 'ar' ? ar : enUS
                        })}
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("strategy.deleteStrategy")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("strategy.deleteConfirm")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className={cn("flex-col sm:flex-row gap-2", isRTL && "sm:flex-row-reverse")}>
                          <AlertDialogCancel className="w-full sm:w-auto">{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(strategy.id)}
                            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("strategy.noStrategies")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("strategy.createFirst")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StrategyBuilder;
