
"use client"; // This component uses client-side hooks (useSidebar)

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import { Header } from "./header"; // Import the new Header component

export function AppLayout({ children }: { children: React.ReactNode }) {
  // defaultOpen can be read from cookie for persistence
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        variant="sidebar" // Default variant
        collapsible="icon" // Collapses to icon mode
        className="border-r"
      >
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              Esper AI
            </h1>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2 pr-0">
          <SidebarNav />
        </SidebarContent>
        
        <SidebarFooter className="p-4 mt-auto border-t group-data-[collapsible=icon]:p-2">
           {/* User Profile button removed from here, still accessible via header dropdown */}
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col">
        <Header /> {/* Use the Header component here */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
