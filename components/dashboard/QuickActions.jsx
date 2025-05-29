"use client";

import Link from 'next/link';
import { 
  Calendar, BookOpen, ClipboardList, 
  FileText, User, Share2, Plus 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function QuickActions({ role }) {
  const { t } = useTranslation();
  // Define actions based on user role
  const actions = [
    role === 'ADMIN' && {
      label: t('Add Academic Year'),
      icon: Calendar,
      href: '/dashboard/academic-years',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    (role === 'ADMIN' || role === 'SUPERVISOR' || role === 'TA') && {
      label: t('Manage Standards'),
      icon: ClipboardList,
      href: '/dashboard/standards',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    (role === 'ADMIN' || role === 'PROFESSOR') && {
      label: t('View Courses'),
      icon: BookOpen,
      href: '/dashboard/courses',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    (role === 'ADMIN' || role === 'SUPERVISOR' || role === 'TA') && {
      label: t('Review Requests'),
      icon: Share2,
      href: '/dashboard/requests',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    },
    role === 'ADMIN' && {
      label: t('Manage Users'),
      icon: User,
      href: '/dashboard/users',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ].filter(Boolean);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Quick Actions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-full justify-start bg-card hover:bg-accent/50"
              >
                <div className={`p-2 mr-2 rounded-full ${action.bgColor}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span>{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}