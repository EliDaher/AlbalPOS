import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import ScreenWrapper from "../ui/ScreenWrapper";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ScreenWrapper>
      <div className="flex h-screen overflow-hidden text-foreground">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onToggleSidebar={toggleSidebar} />
          <main
            className={cn(
              "flex-1 overflow-auto p-4 md:p-6 lg:p-8",
              "transition-all duration-300",
            )}
          >
            <div dir="rtl" className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </ScreenWrapper>
  );
}
