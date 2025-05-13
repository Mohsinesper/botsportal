
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import type { TooltipContentProps } from "@radix-ui/react-tooltip";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => {
        const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.href);
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
