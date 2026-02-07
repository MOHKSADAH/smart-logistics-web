"use client";

import { LayoutDashboard, Activity, FileCheck, Users, Ship, BarChart3, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from 'next-intl';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const locale = useLocale();

  const navItems = [
    {
      title: t('overview'),
      href: `/${locale}`,
      icon: LayoutDashboard,
    },
    {
      title: t('traffic'),
      href: `/${locale}/traffic`,
      icon: Activity,
    },
    {
      title: t('permits'),
      href: `/${locale}/permits`,
      icon: FileCheck,
    },
    {
      title: t('drivers'),
      href: `/${locale}/drivers`,
      icon: Users,
    },
    {
      title: t('vessels'),
      href: `/${locale}/vessels`,
      icon: Ship,
    },
    {
      title: t('analytics'),
      href: `/${locale}/analytics`,
      icon: BarChart3,
    },
    {
      title: t('notifications'),
      href: `/${locale}/notifications`,
      icon: Bell,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex h-16 items-center justify-center px-2 group-data-[collapsible=icon]:px-2">
          <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              {t('title')}
            </span>
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitor</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
