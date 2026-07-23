import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUser, getCurrentUser } from "@/lib/session";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export type inventoryUser = {
  id?: string;
  role: string;
  username: string;
  name?: string;
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const inventoryUser = getCurrentUser();

  return (
    <header dir="rtl" className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="فتح القائمة"
            className="md:hidden"
          >
            <Menu />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">مرحباً</p>
            <p className="font-bold">عالبال / {inventoryUser?.username || "مستخدم"}</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link to="/tables">الطاولات</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard">اليوم</Link>
            </Button>
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="space-y-1 text-right">
                  <p className="text-sm font-medium leading-none">
                    {inventoryUser?.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inventoryUser?.role === "admin" ? "مدير" : "كاشير"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                لوحة التحكم
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/tables")}>
                الطاولات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  clearCurrentUser();
                  navigate("/login");
                }}
              >
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
