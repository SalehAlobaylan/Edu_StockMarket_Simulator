import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell, Settings2, DollarSign, TrendingDown, Target, Percent, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [maxPositionSize, setMaxPositionSize] = useState([10]);
  const [defaultStopLoss, setDefaultStopLoss] = useState([5]);
  const [defaultTakeProfit, setDefaultTakeProfit] = useState([10]);
  const [defaultCommission, setDefaultCommission] = useState([0.1]);
  const [defaultSlippage, setDefaultSlippage] = useState([5]);
  const [initialCapital, setInitialCapital] = useState("100000");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setTimezone(profile.timezone || "Asia/Riyadh");
      setMaxPositionSize([profile.max_position_pct ?? 10]);
      setDefaultStopLoss([profile.default_stop_loss ?? 5]);
      setDefaultTakeProfit([profile.default_take_profit ?? 10]);
      setDefaultCommission([profile.default_commission ?? 0.1]);
      setDefaultSlippage([profile.default_slippage ?? 5]);
      setInitialCapital((profile.default_capital ?? 100000).toString());
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfile.mutate({ full_name: fullName, timezone });
  };

  const handleSaveRisk = () => {
    updateProfile.mutate({
      max_position_pct: maxPositionSize[0],
      default_stop_loss: defaultStopLoss[0],
      default_take_profit: defaultTakeProfit[0],
    });
  };

  const handleSaveExecution = () => {
    updateProfile.mutate({
      default_commission: defaultCommission[0],
      default_slippage: defaultSlippage[0],
      default_capital: parseFloat(initialCapital) || 100000,
    });
  };

  const handleResetDefaults = () => {
    setMaxPositionSize([10]);
    setDefaultStopLoss([5]);
    setDefaultTakeProfit([10]);
    setDefaultCommission([0.1]);
    setDefaultSlippage([5]);
    toast.info(language === "ar" ? "تمت إعادة التعيين للافتراضي" : "Reset to defaults");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mb-8"><h1 className="text-3xl font-bold uppercase tracking-tight">{language === "ar" ? "الإعدادات" : "Settings"}</h1></div>
        <Skeleton className="h-[400px]" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight">{language === "ar" ? "الإعدادات" : "Settings"}</h1>
        <p className="mt-1 text-muted-foreground">{language === "ar" ? "إدارة حسابك وتفضيلات التداول" : "Manage your account and trading preferences"}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="border-2 border-border bg-muted/50 p-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:border-2 data-[state=active]:border-primary"><User className="h-4 w-4" />{language === "ar" ? "الملف الشخصي" : "Profile"}</TabsTrigger>
          <TabsTrigger value="risk" className="gap-2 data-[state=active]:border-2 data-[state=active]:border-primary"><Shield className="h-4 w-4" />{language === "ar" ? "إدارة المخاطر" : "Risk Management"}</TabsTrigger>
          <TabsTrigger value="execution" className="gap-2 data-[state=active]:border-2 data-[state=active]:border-primary"><Settings2 className="h-4 w-4" />{language === "ar" ? "التنفيذ" : "Execution"}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="border-2 border-border bg-card p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider">{language === "ar" ? "معلومات الحساب" : "Account Information"}</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2"><Label>{language === "ar" ? "الاسم الكامل" : "Full Name"}</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-2" /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label><Input value={user?.email || ""} disabled className="border-2 bg-muted" /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "المنطقة الزمنية" : "Timezone"}</Label>
                <Select value={timezone} onValueChange={setTimezone}><SelectTrigger className="border-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem><SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="mt-6"><Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="gap-2 border-2"><Save className="h-4 w-4" />{language === "ar" ? "حفظ التغييرات" : "Save Changes"}</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="border-2 border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wider">{language === "ar" ? "ملف المخاطر الافتراضي" : "Default Risk Profile"}</h2><Button variant="outline" size="sm" onClick={handleResetDefaults} className="gap-2 border-2"><RotateCcw className="h-4 w-4" />{language === "ar" ? "إعادة تعيين" : "Reset"}</Button></div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4"><div className="flex items-center gap-2"><Percent className="h-4 w-4 text-muted-foreground" /><Label>{language === "ar" ? "الحد الأقصى لحجم المركز" : "Max Position Size"}</Label></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">%</span><span className="font-mono font-semibold">{maxPositionSize[0]}%</span></div><Slider value={maxPositionSize} onValueChange={setMaxPositionSize} min={1} max={100} step={1} /></div>
              <div className="space-y-4"><div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-loss" /><Label>{language === "ar" ? "وقف الخسارة الافتراضي" : "Default Stop Loss"}</Label></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">%</span><span className="font-mono font-semibold text-loss">-{defaultStopLoss[0]}%</span></div><Slider value={defaultStopLoss} onValueChange={setDefaultStopLoss} min={1} max={25} step={0.5} /></div>
              <div className="space-y-4"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-profit" /><Label>{language === "ar" ? "جني الأرباح الافتراضي" : "Default Take Profit"}</Label></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">%</span><span className="font-mono font-semibold text-profit">+{defaultTakeProfit[0]}%</span></div><Slider value={defaultTakeProfit} onValueChange={setDefaultTakeProfit} min={1} max={50} step={1} /></div>
            </div>
            <div className="mt-6"><Button onClick={handleSaveRisk} disabled={updateProfile.isPending} className="gap-2 border-2"><Save className="h-4 w-4" />{language === "ar" ? "حفظ ملف المخاطر" : "Save Risk Profile"}</Button></div>
          </div>
        </TabsContent>

        <TabsContent value="execution" className="space-y-6">
          <div className="border-2 border-border bg-card p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider">{language === "ar" ? "إعدادات التنفيذ الافتراضية" : "Default Execution Settings"}</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4"><Label>{language === "ar" ? "العمولة الافتراضية" : "Default Commission"}</Label><div className="flex justify-between text-sm"><span className="text-muted-foreground">%</span><span className="font-mono font-semibold">{defaultCommission[0]}%</span></div><Slider value={defaultCommission} onValueChange={setDefaultCommission} min={0} max={1} step={0.01} /></div>
              <div className="space-y-4"><Label>{language === "ar" ? "الانزلاق الافتراضي" : "Default Slippage"}</Label><div className="flex justify-between text-sm"><span className="text-muted-foreground">bps</span><span className="font-mono font-semibold">{defaultSlippage[0]} bps</span></div><Slider value={defaultSlippage} onValueChange={setDefaultSlippage} min={0} max={50} step={1} /></div>
              <div className="space-y-2"><Label>{language === "ar" ? "رأس المال الابتدائي" : "Initial Capital"}</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">SAR</span><Input type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} className="border-2 font-mono pl-12" /></div></div>
            </div>
            <div className="mt-6"><Button onClick={handleSaveExecution} disabled={updateProfile.isPending} className="gap-2 border-2"><Save className="h-4 w-4" />{language === "ar" ? "حفظ الإعدادات" : "Save Settings"}</Button></div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Settings;
