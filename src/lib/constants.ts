
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Settings, Users, BarChart3, FileText, Megaphone, Cpu, ListChecks, Wand2, ClipboardList, Mic2, Building, UserCog, CreditCard, Briefcase, Settings2, History, PieChart } from 'lucide-react';

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
    href: '/agents',
    label: 'Agent Configurations',
    icon: Settings2, 
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/agent-optimization',
    label: 'Agent Optimization',
    icon: Wand2,
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN", "DESIGN_ADMIN"],
  },
  {
    href: '/agent-call-analysis',
    label: 'Agent Call Analysis',
    icon: PieChart, // Or TrendingDown
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
    href: '/call-logs',
    label: 'Call Logs',
    icon: History, 
    roles: ["SUPER_ADMIN", "CALL_CENTER_ADMIN"],
  },
  {
    href: '/accounting',
    label: 'Accounting',
    icon: Briefcase, 
    roles: ["SUPER_ADMIN"],
  },
  {
    href: '/billing',
    label: 'My Billing',
    icon: CreditCard,
    roles: ["CALL_CENTER_ADMIN"],
  },
  {
    href: '/user-management',
    label: 'User Management',
    icon: UserCog,
    roles: ["SUPER_ADMIN"],
  },
  {
    href: 'https://your-grafana-instance.com', 
    label: 'Grafana Tool',
    icon: BarChart3, 
  },
];
