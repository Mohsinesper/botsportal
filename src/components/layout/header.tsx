
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sun, Moon, UserCircle } from "lucide-react";
import { useTheme } from "next-themes"; // Assuming next-themes is or will be installed for theme toggling
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";

// Helper component for theme toggle, to avoid hydration mismatch with useTheme
function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder or null during server rendering / pre-hydration
    return <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0" disabled />;
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
  const currentNavItem = NAV_ITEMS.find(item => item.match ? item.match(pathname) : pathname.startsWith(item.href));
  const pageTitle = currentNavItem ? currentNavItem.label : "CallFlowAI";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggleClientWrapper />
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


// Client wrapper for ThemeToggle to ensure useTheme works correctly
// This is a common pattern to avoid hydration issues with theme logic
function ThemeToggleClientWrapper() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />; // Placeholder
  }
  
  // Dynamically import ThemeProvider from next-themes if not already part of the root layout
  // For simplicity here, assuming ThemeProvider is in a higher level component or we use a simpler toggle.
  // If next-themes is not installed, this part would need adjustment.
  // For now, let's use a simplified theme toggle that might just toggle a class on body.
  // However, the proper way is using next-themes.

  // For this exercise, I'll install next-themes.
  // Add "next-themes": "^0.3.0" to package.json dependencies.
  // And wrap the RootLayout's children with <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  return <ThemeToggle />;
}

// Need to ensure React is imported if not already.
import * as React from "react";
