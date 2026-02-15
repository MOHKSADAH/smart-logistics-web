"use client";

import { LayoutDashboard, Activity, FileCheck, Users, Building2, Ship, BarChart3, Bell, PlayCircle, LogIn, Presentation } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const t = useTranslations('nav');
  const locale = useLocale();

  const startDemoTour = () => {
    // Clear previous tour state
    sessionStorage.removeItem("porta_demo_tour_seen");

    // Add ?demo=true to current URL (preserving existing params)
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("demo", "true");

    router.push(currentUrl.pathname + currentUrl.search);
  };

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
      title: t('organizations'),
      href: `/${locale}/organizations`,
      icon: Building2,
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
    {
      title: t('demoControl'),
      href: `/${locale}/demo-control`,
      icon: PlayCircle,
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
          <SidebarGroupLabel>{t('monitor')}</SidebarGroupLabel>
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

        <SidebarGroup>
          <SidebarGroupLabel>{t('quickLinks')}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={startDemoTour}
                tooltip={t('demoTour')}
              >
                <Presentation />
                <span>{t('demoTour')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/org-login'}
                tooltip={t('orgPortal')}
              >
                <Link href="/org-login">
                  <LogIn />
                  <span>{t('orgPortal')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
