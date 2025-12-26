import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  FlaskConical,
  BarChart2,
  Settings,
  Briefcase,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassPanel } from "@/components/ui/glass-panel";

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutGrid, labelKey: "nav.dashboard", href: "/" },
  { icon: FlaskConical, labelKey: "nav.strategyBuilder", href: "/strategy" },
  { icon: BarChart2, labelKey: "nav.simulations", href: "/simulations" },
  { icon: Briefcase, labelKey: "nav.portfolio", href: "/portfolio" },
];

const secondaryNavItems: NavItem[] = [
  { icon: GitCompare, labelKey: "nav.compare", href: "/compare" },
  { icon: Settings, labelKey: "nav.settings", href: "/settings" },
];

export function FloatingDock() {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <GlassPanel className="px-3 py-3 rounded-2xl flex items-center gap-2 shadow-dock border-border/30">
        {/* Main Navigation */}
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "dock-item",
              isActive(item.href) && "active"
            )}
          >
            <item.icon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="dock-tooltip">{t(item.labelKey)}</span>
          </Link>
        ))}

        {/* Divider */}
        <div className="w-px h-8 bg-foreground/10 mx-1" />

        {/* Secondary Navigation */}
        {secondaryNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "dock-item",
              isActive(item.href) && "active"
            )}
          >
            <item.icon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="dock-tooltip">{t(item.labelKey)}</span>
          </Link>
        ))}
      </GlassPanel>
    </div>
  );
}
