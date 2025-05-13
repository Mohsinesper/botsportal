
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Settings, Users, BarChart3, FileText, Megaphone, Cpu, ListChecks, Wand2, ClipboardList, Mic2, Building, UserCog } from 'lucide-react'; // Added UserCog

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
  roles?: string[]; // Optional: roles that can see this item. If undefined, all roles.
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/',
  },
  {
    href: '/call-centers',
    label: 'Call Centers',
    icon: Building,
    // SUPER_ADMIN can manage all. CALL_CENTER_ADMIN can view/manage their assigned ones.
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN"], 
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: Megaphone,
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/voices',
    label: 'Voices',
    icon: Mic2,
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/agent-optimization',
    label: 'Agent Optimization',
    icon: Wand2,
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/bot-generation',
    label: 'Bot Generation',
    icon: Cpu,
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/bot-tracking',
    label: 'Bot Tracking',
    icon: ListChecks,
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/user-management',
    label: 'User Management',
    icon: UserCog, // Using UserCog as UserShield is not in lucide-react by default
    roles: ["SUPER_ADMIN"], // Only Super Admins can see this
  },
];
