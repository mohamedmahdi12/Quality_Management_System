'use client';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ClipboardList, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';

export default function AcademicYearDetails({ params }) {
  const router = useRouter();
  const { academicYearId } = params;
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const [academicYearTitle, setAcademicYearTitle] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchYear() {
      try {
        console.log("Fetching academic year with ID:", academicYearId);
        const res = await apiClient(`/academic-years/${academicYearId}/`);

        if (res.ok) {
          const data = await res.json();
          setAcademicYearTitle(`${data.start_date} - ${data.end_date}`);
          setError(null);
        } else if (res.status === 404) {
          setError(t('Academic year not found.'));
          setAcademicYearTitle('');
        } else {
          setError(t('An error occurred while fetching the academic year.'));
          setAcademicYearTitle('');
          console.error("Error fetching academic year:", res.status, res.statusText);
        }

      } catch (err) {
        setError(t('Failed to connect to the server.'));
        setAcademicYearTitle('');
        console.error("Fetch error:", err);
      }

    }
    fetchYear();
  }, [academicYearId, t, apiClient]);

  const cards = [
    {
      title: t('Institutional Accreditation Standards'),
      description: t('View all institutional accreditation standards for this year.'),
      icon: <span className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 mb-4"><ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-300" /></span>,
      onClick: () => router.push(`/dashboard/standards?tab=ACADEMIC&year=${academicYearId}`),
    },
    {
      title: t('Program Accreditation Standards'),
      description: t('View all program accreditation standards for this year.'),
      icon: <span className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800 mb-4"><ClipboardList className="w-8 h-8 text-purple-600 dark:text-purple-300" /></span>,
      onClick: () => router.push(`/dashboard/standards?tab=PRAGMATIC&year=${academicYearId}`),
    },
    {
      title: t('Courses'),
      description: t('View all courses for this year.'),
      icon: <span className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800 mb-4"><BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-300" /></span>,
      onClick: () => router.push(`/dashboard/courses?year=${academicYearId}`),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-16 space-y-12 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-extrabold mb-10 text-center text-gray-800 dark:text-gray-100">{t('Academic Year Details')}</h1>

      {error && <div className="text-center text-red-600 text-xl font-semibold">{error}</div>}

      {!error && academicYearTitle && <h2 className="text-center text-2xl font-bold mb-8 text-gray-700 dark:text-gray-300">{academicYearTitle}</h2>}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {cards.map((card, idx) => (
            <Card
              key={card.title}
              className="cursor-pointer hover:shadow-2xl transition p-8 flex flex-col items-center justify-center min-h-[320px] border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group"
              onClick={card.onClick}
            >
              {card.icon}
              <CardTitle className="text-2xl font-bold text-center mb-3 text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{card.title}</CardTitle>
              <CardContent className="p-0 text-center text-lg text-gray-600 dark:text-gray-300 font-medium">
                {card.description}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 