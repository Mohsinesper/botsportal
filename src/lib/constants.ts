
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Settings, Users, BarChart3, FileText, Megaphone, Cpu, ListChecks, Wand2, ClipboardList, Mic2, Building } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
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
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: Megaphone,
  },
  {
    href: '/voices',
    label: 'Voices',
    icon: Mic2,
  },
  {
    href: '/agent-optimization',
    label: 'Agent Optimization',
    icon: Wand2,
  },
  {
    href: '/bot-generation',
    label: 'Bot Generation',
    icon: Cpu,
  },
  {
    href: '/bot-tracking',
    label: 'Bot Tracking',
    icon: ListChecks,
  },
];

