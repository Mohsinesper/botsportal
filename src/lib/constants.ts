
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, BotMessageSquare, Settings, Users, BarChart3, FileText, Megaphone, Cpu, ListChecks, Wand2, ClipboardList } from 'lucide-react';

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
    href: '/campaigns',
    label: 'Campaigns',
    icon: Megaphone,
  },
  {
    href: '/master-script-generator',
    label: 'Script Generator',
    icon: FileText,
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
