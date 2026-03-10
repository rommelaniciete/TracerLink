import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
  BookOpen,
  Forward,
  LayoutDashboard,
  UsersIcon,
  ChartLine,
  Link2,
  FormInputIcon,
  FolderMinusIcon,
  GraduationCap,
  FileText,
  Info,
} from 'lucide-react';
import AppLogo from './app-logo';
import AppearanceTabs from './appearance-tabs';
import { Button } from './ui/button';

//top
const primaryNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Alumni List',
    href: '/list',
    icon: UsersIcon,
  },
  {
    title: 'Analytics',
    href: '/data',
    icon: ChartLine,
  },
];

//bot
const secondaryNavItems: NavItem[] = [
  {
    title: 'Manage Alumni',
    href: '/send',
    icon: GraduationCap,
  },
  {
    title: 'Manage Job Posts',
    href: '/jobpost',
    icon: FileText,
  },
];

const ThirdNavItems: NavItem[] = [
  {
    title: 'Employability Report',
    href: '/employability',
    icon: BookOpen,
  },
];

const footerNavItems: NavItem[] = [
  {
    title: 'About Us',
    href: '/about',
    icon: Info,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Group 1 */}
        <SidebarGroupLabel>Overview</SidebarGroupLabel>
        <NavMain items={primaryNavItems} />
        {/* Group 2 */}
        <SidebarGroupLabel>Management</SidebarGroupLabel>
        <NavMain items={secondaryNavItems} />
        {/* Group 3 */}
        <SidebarGroupLabel>Print Report</SidebarGroupLabel>
        <NavMain items={ThirdNavItems} />
        <SidebarGroupLabel>About Us</SidebarGroupLabel>
        <NavMain items={footerNavItems} />
      </SidebarContent>

      <SidebarFooter> 
        <SidebarGroupLabel>Manage account and other settings.</SidebarGroupLabel>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
