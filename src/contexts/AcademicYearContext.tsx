import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers';

interface AcademicYearContextType {
  selectedYear: string | null;
  setSelectedYear: (year: string) => void;
  activeYear: any;
  refreshActiveYear: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<any>(null);
  const { apiClient } = useAuth();

  // جلب السنة النشطة من الـ API
  const refreshActiveYear = async () => {
    try {
      const res = await apiClient('/academic-years/?status=ACTIVE');
      const data = await res.json();
      setActiveYear(data.results?.[0] || null);
    } catch (e) {
      setActiveYear(null);
    }
  };

  useEffect(() => {
    refreshActiveYear();
  }, []);

  return (
    <AcademicYearContext.Provider value={{ selectedYear, setSelectedYear, activeYear, refreshActiveYear }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const { t } = useTranslation();
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error(t('useAcademicYear must be used within an AcademicYearProvider'));
  }
  return context;
} 