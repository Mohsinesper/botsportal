
"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sun, Moon, UserCircle, Building, ChevronsUpDown, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { Skeleton } from "@/components/ui/skeleton";


function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0" disabled aria-label="Toggle theme placeholder" />;
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-8 h-8"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}


export function Header() {
  const pathname = usePathname();
  const { callCenters, currentCallCenter, setCurrentCallCenterById, isLoading } = useCallCenter();

  const currentNavItem = NAV_ITEMS.find(item => item.match ? item.match(pathname) : pathname.startsWith(item.href));
  const pageTitle = currentNavItem ? currentNavItem.label : "CallFlowAI";


  const handleCallCenterChange = (callCenterId: string) => {
    setCurrentCallCenterById(callCenterId);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {isLoading ? (
           <Skeleton className="h-8 w-40 rounded-md" />
        ) : callCenters.length > 0 && currentCallCenter ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[180px] justify-start">
                <Building className="mr-2 h-4 w-4" />
                <span className="truncate flex-1 text-left">{currentCallCenter.name}</span>
                <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuLabel>Switch Call Center</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
              {callCenters.map((center) => (
                <DropdownMenuItem
                  key={center.id}
                  onClick={() => handleCallCenterChange(center.id)}
                  className="cursor-pointer"
                >
                  <Building className={`mr-2 h-4 w-4 ${currentCallCenter.id === center.id ? 'opacity-100' : 'opacity-0'}`} />
                  {center.name}
                  {currentCallCenter.id === center.id && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/call-centers">Manage Call Centers</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <Button variant="outline" asChild>
             <Link href="/call-centers">
                <Building className="mr-2 h-4 w-4" />
                Add Call Center
             </Link>
           </Button>
        )}
        
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://picsum.photos/100/100" alt="User avatar" data-ai-hint="user avatar" />
                <AvatarFallback>
                  <UserCircle className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
