import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  FlaskConical,
  GitCompare,
  Briefcase,
  Database,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();

  const navItems = [
    { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/" },
    { icon: FlaskConical, labelKey: "nav.strategyBuilder", href: "/strategy" },
    { icon: LineChart, labelKey: "nav.simulations", href: "/simulations" },
    { icon: GitCompare, labelKey: "nav.compare", href: "/compare" },
    { icon: Briefcase, labelKey: "nav.portfolio", href: "/portfolio" },
    { icon: Database, labelKey: "nav.marketData", href: "/market" },
  ];

  const bottomNavItems = [
    { icon: Settings, labelKey: "nav.settings", href: "/settings" },
  ];

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Mobile: show overlay when open
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
        
        {/* Sidebar */}
        <aside className={cn(
          "fixed top-0 z-50 h-screen w-72 bg-sidebar transition-transform duration-300",
          isRTL ? "right-0 border-l-2 border-sidebar-border" : "left-0 border-r-2 border-sidebar-border",
          isOpen 
            ? "translate-x-0" 
            : isRTL ? "translate-x-full" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col">
            {/* Header with close button */}
            <div className={cn(
              "flex h-16 items-center justify-between border-b-2 border-sidebar-border px-4",
              isRTL && "flex-row-reverse"
            )}>
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-sidebar-foreground bg-sidebar-primary">
                  <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-wider text-sidebar-foreground">
                    {t("brand.name")}
                  </span>
                  <span className="text-xs text-sidebar-foreground/70">{t("brand.tagline")}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              <p className={cn(
                "mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50",
                isRTL && "text-right"
              )}>
                {t("nav.mainMenu")}
              </p>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      "border-2 border-transparent",
                      isActive
                        ? "border-sidebar-foreground bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t-2 border-sidebar-border p-4">
              {bottomNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      "border-2 border-transparent",
                      isActive
                        ? "border-sidebar-foreground bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>

            {/* Market Status */}
            <div className="border-t-2 border-sidebar-border p-4">
              <div className="flex items-center justify-between px-3 text-xs">
                <span className="text-sidebar-foreground/50">{t("market.tasiMarket")}</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-profit" />
                  <span className="text-sidebar-foreground">{t("market.closed")}</span>
                </span>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop: always visible
  return (
    <aside className={cn(
      "fixed top-0 z-40 h-screen w-64 bg-sidebar",
      isRTL ? "right-0 border-l-2 border-sidebar-border" : "left-0 border-r-2 border-sidebar-border"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center gap-3 border-b-2 border-sidebar-border px-6",
          isRTL && "flex-row"
        )}>
          <div className="flex h-10 w-10 items-center justify-center border-2 border-sidebar-foreground bg-sidebar-primary">
            <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wider text-sidebar-foreground">
              {t("brand.name")}
            </span>
            <span className="text-xs text-sidebar-foreground/70">{t("brand.tagline")}</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <p className={cn(
            "mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50",
            isRTL && "text-right"
          )}>
            {t("nav.mainMenu")}
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  "border-2 border-transparent",
                  isActive
                    ? "border-sidebar-foreground bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  isRTL && "flex-row-reverse"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t-2 border-sidebar-border p-4">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  "border-2 border-transparent",
                  isActive
                    ? "border-sidebar-foreground bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>

        {/* Market Status */}
        <div className="border-t-2 border-sidebar-border p-4">
          <div className="flex items-center justify-between px-3 text-xs">
            <span className="text-sidebar-foreground/50">{t("market.tasiMarket")}</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-profit" />
              <span className="text-sidebar-foreground">{t("market.closed")}</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
