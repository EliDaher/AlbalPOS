import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  Table2Icon,
  TableIcon,
  Box,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigationGroups = [
  {
    name: "المستودع",
    href: "/inventory",
    icon: Package,
    allowed: ["admin"],
  },
  {
    name: "المنتجات",
    href: "/Products",
    icon: Coffee,
    allowed: ["admin"],
  },
  {
    name: "الموردين",
    href: "/Suppliers",
    icon: Users,
    allowed: ["admin"],
  },
  {
    name: "الطاولات",
    href: "/tables",
    icon: TableIcon,
    allowed: ["admin"],
  },
  // {
  //   name: "الفواتير",
  //   href: "/invoices",
  //   icon: TableIcon,
  //   allowed: ["admin"],
  // },
  {
    name: "الزبائن",
    href: "/Customers",
    icon: Users,
    allowed: ["admin"],
  },
  {
    name: "الرصيد",
    href: "/Balance",
    icon: Box,
    allowed: ["admin"],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const userStr = localStorage.getItem("InventoryUser");
  const user = JSON.parse(userStr);

  const isDashboardActive = location.pathname === "/dashboard";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col border-r bg-sidebar transition-all duration-300 ease-in-out shadow-md",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-accent">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-sidebar-foreground tracking-wide">
              عالبال
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 rounded-full text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Dashboard Link */}
      {['admin', 'dealer'].includes(user.role) && <nav className="px-2 py-3">
        <Link
          to="/dashboard"
          className={cn(
            "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
            isDashboardActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <Home className="h-5 w-5 flex-shrink-0 ml-3" />
          {!isCollapsed && "الصفحة الرئيسية"}
        </Link>
      </nav>}

      {/* Other Navigation Groups */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {navigationGroups.map((group) => {
          const isActive = location.pathname === group.href;
          return (
            group.allowed.includes(user.role) && (
              <Link
                key={group.name}
                to={group.href}
                className={cn(
                  "group flex mt-2 items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <group.icon className="h-5 w-5 flex-shrink-0 ml-3" />
                {!isCollapsed && group.name}
              </Link>
            )
          );
        })}
      </nav>
    </div>
  );
}
