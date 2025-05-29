"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/providers';
import { 
  LayoutDashboard, Calendar, BookOpen, 
  ClipboardList, FileText, Users, Share2,
  ChevronsLeft, ChevronsRight, ShieldCheck
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearFromUrl = searchParams.get('year');
  const { user, apiClient } = useAuth();
  const [activeYear, setActiveYear] = useState(null);
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  useEffect(() => {
    apiClient('/academic-years/?status=ACTIVE')
      .then(res => res.json())
      .then(data => setActiveYear(data.results?.[0] || null));
  }, [apiClient]);
  
  const isAdmin = user?.role === 'ADMIN';
  
  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      isActive: pathname === '/dashboard',
      showFor: ['ADMIN', 'SUPERVISOR', 'PROFESSOR', 'TA'],
    },
    // {
    //   label: 'Structure',
    //   icon: FileText,
    //   href: '/dashboard/structure',
    //   isActive: pathname === '/dashboard/structure',
    //   showFor: ['ADMIN', 'SUPERVISOR', 'PROFESSOR', 'TA'],
    // },
    {
      label: 'Academic Years',
      icon: Calendar,
      href: '/dashboard/academic-years',
      isActive: pathname === '/dashboard/academic-years',
      showFor: ['ADMIN'],
    },
    {
      label: 'Courses',
      icon: BookOpen,
      href: '/dashboard/courses',
      isActive: pathname === '/dashboard/courses',
      showFor: ['ADMIN', 'PROFESSOR'],
    },
    {
      label: 'Standards',
      icon: ClipboardList,
      href: '/dashboard/standards',
      isActive: pathname === '/dashboard/standards',
      showFor: ['ADMIN', 'SUPERVISOR', 'TA'],
    },
    {
      label: 'Users',
      icon: Users,
      href: '/dashboard/users',
      isActive: pathname === '/dashboard/users',
      showFor: ['ADMIN'],
    },
    {
      label: 'Requests',
      icon: Share2,
      href: '/dashboard/requests',
      isActive: pathname === '/dashboard/requests',
      showFor: ['ADMIN', 'SUPERVISOR', 'TA'],
    },
  ];
  
  const filteredRoutes = routes.filter((route) => 
    user && route.showFor.includes(user.role)
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        isArabic && "text-right"
      )}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className={cn(
        "h-14 flex items-center px-4 border-b",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className={cn("flex items-center space-x-2", isArabic && "flex-row-reverse space-x-reverse") }>
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-blue-600">{t('Quality Assurance Unit')}</span>
          </Link>
        )}
        {collapsed && (
          <ShieldCheck className="h-6 w-6 text-primary" />
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={collapsed ? "hidden" : "ml-auto"}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 pt-1">
        <div className="px-3 py-2">
          <h3 className={cn(
            "mb-2 text-xs font-semibold text-muted-foreground",
            collapsed && "text-center"
          )}>
            {collapsed ? t('Menu') : t('Main Menu')}
          </h3>
          <nav className="space-y-1">
            {filteredRoutes.map((route) => {
              let href = route.href;
              let disabled = false;
              let tooltip = '';
              if ((route.label === 'Courses' || route.label === 'Standards' || route.label === 'Structure')) {
                if (yearFromUrl) {
                  href = `${route.href}?year=${yearFromUrl}`;
                } else if (activeYear) {
                  href = `${route.href}?year=${activeYear.id}`;
                } else {
                  disabled = true;
                  tooltip = t('No active academic year');
                }
              }
              return (
                <span key={route.href} title={tooltip} style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                      route.isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted",
                      collapsed && "justify-center",
                      isArabic && "flex-row-reverse"
                    )}
                  >
                    <route.icon className={cn("h-4 w-4", collapsed ? "" : isArabic ? "ml-3" : "mr-3")} />
                    {!collapsed && <span>{t(route.label)}</span>}
                  </Link>
                </span>
              );
            })}
          </nav>
        </div>
      </ScrollArea>
      
      <div className={cn(
        "p-3 border-t flex",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <ThemeToggle collapsed={collapsed} />
        {collapsed ? (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCollapsed(false)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}