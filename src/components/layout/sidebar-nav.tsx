
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import type { TooltipContentProps } from "@radix-ui/react-tooltip";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    // Optionally show a loading state or a reduced set of links
    return (
       <SidebarMenu>
        {[...Array(5)].map((_, i) => (
          <SidebarMenuItem key={i} className="p-2">
            <div className="h-8 w-full bg-muted/50 animate-pulse rounded-md" />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (!item.roles || item.roles.length === 0) {
      return true; // No specific roles defined, accessible to all
    }
    return currentUser && item.roles.includes(currentUser.role);
  });

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => {
        const isActive = item.match ? item.match(pathname) : (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href));
        const tooltipProps: TooltipContentProps = { children: item.label, side: "right", align: "center" };
        
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={tooltipProps}
                aria-label={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
