import Link from 'next/link';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { selectedYear } = useAcademicYear();
  const [activeYear, setActiveYear] = useState(null);
  const { t } = useTranslation();

  const links = [
    { href: '/courses', label: t('Courses') },
    { href: '/standards', label: t('Standards') },
    { href: '/academic-years', label: t('Academic Years') },
  ];

  useEffect(() => {
    async function fetchActiveYear() {
      try {
        const res = await fetch('/api/academic-years?status=ACTIVE');
        const data = await res.json();
        setActiveYear(data.results?.[0] || null);
      } catch (e) {}
    }
    fetchActiveYear();
  }, []);

  const isDisabled = !selectedYear && !activeYear;

  return (
    <nav className="flex flex-col space-y-2 p-4">
      {links.map((link) => {
        const isDisabled = !selectedYear && link.href !== '/academic-years';
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-4 py-2 rounded-md transition-colors',
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100'
            )}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              }
            }}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href={activeYear ? `/dashboard/structure?year=${activeYear.id}` : '#'}
        className={isDisabled ? 'opacity-50 pointer-events-none' : ''}
        tabIndex={isDisabled ? -1 : 0}
      >
        {t('Structure')}
      </Link>
    </nav>
  );
} 