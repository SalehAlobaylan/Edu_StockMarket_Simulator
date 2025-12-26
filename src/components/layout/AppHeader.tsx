import { Bell, Menu, Moon, Search, Sun, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const { t, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className={cn(
      "fixed top-0 z-30 h-16 border-b-2 border-border bg-background",
      isMobile 
        ? "left-0 right-0" 
        : isRTL ? "right-64 left-0" : "left-64 right-0"
    )}>
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side - Menu button on mobile, Search on desktop */}
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="h-10 w-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Search - hidden on mobile */}
          <div className={cn("relative hidden md:block", isMobile ? "w-full" : "w-96")}>
            <Search className={cn(
              "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
              isRTL ? "right-3" : "left-3"
            )} />
            <Input
              placeholder={t("header.search")}
              className={cn("h-10 border-2 font-mono text-sm", isRTL ? "pr-10" : "pl-10")}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className={cn("flex items-center gap-1 md:gap-2", isRTL && "flex-row-reverse")}>
          {/* Market Ticker - hidden on mobile */}
          <div className={cn(
            "hidden lg:flex items-center gap-4 border-2 border-border px-4 py-2", 
            isRTL ? "ml-4" : "mr-4"
          )}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">TASI</span>
              <span className="font-mono text-sm font-semibold">12,456.78</span>
              <span className="text-xs font-semibold text-profit">+1.24%</span>
            </div>
          </div>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 md:h-10 md:w-10 border-2"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="icon" className="relative h-9 w-9 md:h-10 md:w-10 border-2">
            <Bell className="h-4 w-4" />
            <span className={cn(
              "absolute flex h-4 w-4 items-center justify-center bg-primary text-[10px] font-bold text-primary-foreground",
              isRTL ? "-left-1 -top-1" : "-right-1 -top-1"
            )}>
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10 border-2">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{t("header.myAccount") || "My Account"}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t("header.signOut") || "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
