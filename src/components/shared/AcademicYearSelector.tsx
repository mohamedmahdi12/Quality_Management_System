import { useEffect, useState } from 'react';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { fetchAcademicYears } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface AcademicYear {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

export function AcademicYearSelector() {
  const { selectedYear, setSelectedYear } = useAcademicYear();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const loadYears = async () => {
      try {
        const data = await fetchAcademicYears();
        setYears(data);
      } catch (error) {
        console.error(t('Failed to fetch academic years'), error);
      } finally {
        setLoading(false);
      }
    };

    loadYears();
  }, []);

  if (loading) {
    return <div>{t('Loading academic years...')}</div>;
  }

  return (
    <Select value={selectedYear || ''} onValueChange={setSelectedYear}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder={t('Select Academic Year')} />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year.id} value={year.id}>
            {year.start_date} - {year.end_date} ({t(year.status.toUpperCase())})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 