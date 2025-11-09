import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export interface inventoryUser {
  id: string,
  password: string,
  role: string,
  username: string,
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate()
  const [inventoryUser, setInventoryUser] = useState<inventoryUser>()

  useEffect(()=>{
    const temUser = JSON.parse(localStorage.getItem("InventoryUser") || "null");
    setInventoryUser(temUser)
  },[])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 md:flex">
          <div className="mr-6 flex items-center space-x-2">
            <span className="font-bold md:inline-block">
              عالبال / {inventoryUser?.username}
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">

          </div>
          <nav className="flex items-center space-x-2">
            {/*<ThemeToggle />*/}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg" alt="@user" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{inventoryUser?.username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={()=>{
                  localStorage.removeItem('InventoryUser')
                  navigate('/login')
                }}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
