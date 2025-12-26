import { Zap, User, LogOut, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 w-full z-40 px-4 md:px-6 py-4 flex justify-between items-center pointer-events-none">
      {/* Brand */}
      <div className={cn(
        "flex items-center gap-3 md:gap-4 pointer-events-auto",
        isRTL && "flex-row-reverse"
      )}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-chart-2 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
          <div className="relative w-9 h-9 md:w-10 md:h-10 bg-card ring-1 ring-card/5 rounded-lg flex items-center justify-center border border-border/50">
            <Zap className="text-primary w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
        <div className={cn(isRTL && "text-right")}>
        <h1 className="text-base md:text-lg font-bold tracking-tight leading-none text-foreground font-display">
            Stockmarket<span className="text-primary"> Simulator</span>
          </h1>
        </div>
      </div>

      {/* Global Status */}
      <div className={cn(
        "flex items-center gap-3 md:gap-6 pointer-events-auto",
        isRTL && "flex-row-reverse"
      )}>
        {/* System Status - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            LATENCY: 24ms
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
            NODES: 12/12
          </span>
        </div>

        {/* Market Status Pill */}
        <GlassPanel className="px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2 md:gap-3 border-profit/20 shadow-glow-green/10">
          <span className="live-indicator" />
          <span className="text-[10px] md:text-xs font-bold text-profit font-mono tracking-wide">
            TASI: 11,405.20
          </span>
          <span className="hidden sm:inline text-[10px] text-profit font-mono">▲ 0.45%</span>
        </GlassPanel>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 md:h-10 md:w-10 border-border/50 bg-card/50 backdrop-blur-sm"
          onClick={toggleTheme}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Language Toggle - visible on all screens */}
        <LanguageToggle />

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-b from-muted to-card p-[1px] cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 glass-panel border-border/50">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t("header.myAccount") || "My Account"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-secondary focus:text-secondary">
              <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("header.signOut") || "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
