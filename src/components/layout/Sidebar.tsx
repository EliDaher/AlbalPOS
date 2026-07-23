import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Package,
  ReceiptText,
  TableIcon,
  Users,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

const navigationGroups = [
  {
    name: "لوحة التحكم",
    href: "/dashboard",
    icon: BarChart3,
    allowed: ["admin", "dealer"],
  },
  {
    name: "الطاولات",
    href: "/tables",
    icon: TableIcon,
    allowed: ["admin", "dealer"],
  },
  {
    name: "المنتجات",
    href: "/products",
    icon: Coffee,
    allowed: ["admin"],
  },
  {
    name: "المستودع",
    href: "/inventory",
    icon: Package,
    allowed: ["admin"],
  },
  {
    name: "الزبائن",
    href: "/customers",
    icon: Users,
    allowed: ["admin", "dealer"],
  },
  {
    name: "الموردون",
    href: "/suppliers",
    icon: ReceiptText,
    allowed: ["admin"],
  },
  {
    name: "الرصيد",
    href: "/balance",
    icon: WalletCards,
    allowed: ["admin"],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const user = getCurrentUser();

  return (
    <aside
      dir="rtl"
      className={cn(
        "relative hidden h-full flex-col border-l bg-sidebar text-sidebar-foreground shadow-sm transition-all duration-300 ease-in-out md:flex",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <div>
            <p className="text-lg font-bold">عالبال</p>
            <p className="text-xs text-muted-foreground">نقطة البيع</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9 rounded-md text-sidebar-foreground"
          aria-label={isCollapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigationGroups
          .filter((group) => user && group.allowed.includes(user.role))
          .map((group) => {
            const isActive =
              location.pathname.toLowerCase() === group.href.toLowerCase();
            return (
              <Link
                key={group.href}
                to={group.href}
                className={cn(
                  "flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/70",
                )}
                title={isCollapsed ? group.name : undefined}
              >
                <group.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{group.name}</span>}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
