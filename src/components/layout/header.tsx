
"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sun, Moon, UserCircle, Building, ChevronsUpDown, Check, Users, LogOut, UserCog } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useAuth } from "@/contexts/AuthContext";
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
  const { callCenters: accessibleCallCenters, currentCallCenter, setCurrentCallCenterById, isLoading: isCallCenterLoading } = useCallCenter();
  const { currentUser, users: mockUsers, setCurrentUserById: setCurrentMockUserById, isLoading: isAuthLoading } = useAuth();

  const currentNavItem = NAV_ITEMS.find(item => item.match ? item.match(pathname) : (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)));
  const pageTitle = currentNavItem ? currentNavItem.label : "CallFlowAI";


  const handleCallCenterChange = (callCenterId: string) => {
    setCurrentCallCenterById(callCenterId);
  };

  const handleMockUserChange = (userId: string) => {
    setCurrentMockUserById(userId);
    // Potentially reset currentCallCenter or let CallCenterContext handle it based on new user's accessibility
  };
  
  const isLoading = isCallCenterLoading || isAuthLoading;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {isLoading ? (
           <Skeleton className="h-9 w-40 rounded-md" />
        ) : accessibleCallCenters.length > 0 && currentCallCenter ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[180px] max-w-[250px] justify-start">
                <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1 text-left">{currentCallCenter.name}</span>
                <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
              <DropdownMenuLabel>Switch Call Center</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
              {accessibleCallCenters.map((center) => (
                <DropdownMenuItem
                  key={center.id}
                  onClick={() => handleCallCenterChange(center.id)}
                  className="cursor-pointer"
                  disabled={currentCallCenter.id === center.id}
                >
                  <Building className={`mr-2 h-4 w-4 ${currentCallCenter.id === center.id ? 'opacity-100' : 'opacity-50'}`} />
                  {center.name}
                  {currentCallCenter.id === center.id && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              </DropdownMenuGroup>
              {currentUser?.role === "SUPER_ADMIN" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/call-centers">Manage All Call Centers</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : currentUser?.role === "SUPER_ADMIN" ? (
           <Button variant="outline" asChild>
             <Link href="/call-centers">
                <Building className="mr-2 h-4 w-4" />
                Add Call Center
             </Link>
           </Button>
        ) : (
          <Button variant="outline" disabled>
            <Building className="mr-2 h-4 w-4" />
            No Centers Available
          </Button>
        )}
        
        <ThemeToggle />

        {isLoading ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://picsum.photos/seed/${currentUser.id}/100/100`} alt={currentUser.name || currentUser.email} data-ai-hint="user avatar" />
                  <AvatarFallback>
                    <UserCircle className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="font-semibold">{currentUser.name || currentUser.email}</div>
                <div className="text-xs text-muted-foreground">{currentUser.email} ({currentUser.role})</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <UserCog className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal">Switch Mock User (Dev)</DropdownMenuLabel>
                 <DropdownMenuRadioGroup value={currentUser.id} onValueChange={handleMockUserChange}>
                    {mockUsers.map(user => (
                        <DropdownMenuRadioItem key={user.id} value={user.id} className="text-xs">
                             {user.name || user.email} ({user.role})
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                 <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
