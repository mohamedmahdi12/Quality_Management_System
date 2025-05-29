"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAcademicYear } from '../../src/contexts/AcademicYearContext';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// قائمة ثابتة للتخصصات
const allDepartments = [
  { value: 'AI', label: 'Artificial Intelligence' },
  { value: 'CS', label: 'Computer Science' },
  { value: 'IS', label: 'Information Systems' },
  { value: 'NT', label: 'Network' }
];

export default function CourseForm({ initialData, onSubmit, onCancel }) {
  const { apiClient } = useAuth();
  const searchParams = useSearchParams();
  const yearFromUrl = searchParams.get('year');
  const { selectedYear } = useAcademicYear();
  const academicYearValue = yearFromUrl || selectedYear;
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    code: initialData?.code || '',
    level: initialData?.level !== undefined ? initialData.level.toString() : '1',
    semester: initialData?.semester !== undefined ? initialData.semester.toString() : '1',
    credit_hours: initialData?.credit_hours !== undefined ? initialData.credit_hours.toString() : '3',
    professor_id: initialData?.professor?.id || initialData?.professor_id || '',
    department: initialData?.department || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearsRes, profsRes] = await Promise.all([
          apiClient('/academic-years/'),
          apiClient('/users/?role=PROFESSOR')
        ]);
        
        const yearsData = await yearsRes.json();
        const profsData = await profsRes.json();
        
        setAcademicYears(yearsData.results || []);
        setProfessors(profsData.results || []);
        // Use the hardcoded departments list
        setDepartments(allDepartments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [apiClient]);
  
  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        code: initialData.code || '',
        level: initialData.level !== undefined ? initialData.level.toString() : '1',
        semester: initialData.semester !== undefined ? initialData.semester.toString() : '1',
        credit_hours: initialData.credit_hours !== undefined ? initialData.credit_hours.toString() : '3',
        professor_id: initialData.professor?.id || initialData.professor_id || '',
        department: initialData.department || '',
      });
    }
  }, [initialData, professors]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('Title is required');
    }
    
    if (!formData.code.trim()) {
      newErrors.code = t('Course code is required');
    }
    
    if (!academicYearValue) {
      newErrors.academic_year = t('Academic year is required');
    }
    
    if (!formData.professor_id) {
      newErrors.professor_id = t('Must select professor');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { professor_id, department, ...rest } = formData;
      const payload = {
        ...rest,
        academic_year: academicYearValue,
      };

      // أضف professor_id فقط إذا تم اختياره
      if (professor_id) {
        payload.professor_id = professor_id;
      }

      // أضف department فقط إذا كان المستوى 3 أو 4 وتم اختياره
      if ((formData.level === '3' || formData.level === '4') && department) {
        payload.department = department;
      }

      // احذف أي حقول قيمتها فارغة أو ""
      Object.keys(payload).forEach(
        (key) => (payload[key] === "" || payload[key] === undefined) && delete payload[key]
      );

      await onSubmit(payload);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get academic year display text
  const getAcademicYearText = (yearId) => {
    const year = academicYears.find(y => y.id === yearId);
    if (!year) return 'Select Academic Year';
    
    const startYear = new Date(year.start_date).getFullYear();
    const endYear = new Date(year.end_date).getFullYear();
    return `${startYear}-${endYear}`;
  };
  
  return (
    <form onSubmit={handleSubmit} dir={isArabic ? 'rtl' : 'ltr'} className={isArabic ? 'text-right' : ''}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title" className="required">
            {t('Course Title')}
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('Introduction to Computer Science')}
            required
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="code" className="required">
            {t('Course Code')}
          </Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder={t('Course Code')}
            required
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="level" className="required">
              {t('Level')}
            </Label>
            <Select 
              value={formData.level} 
              onValueChange={(value) => handleSelectChange('level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Level')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('Level 1')}</SelectItem>
                <SelectItem value="2">{t('Level 2')}</SelectItem>
                <SelectItem value="3">{t('Level 3')}</SelectItem>
                <SelectItem value="4">{t('Level 4')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="semester" className="required">
              {t('Semester')}
            </Label>
            <Select 
              value={formData.semester} 
              onValueChange={(value) => handleSelectChange('semester', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Semester')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('Semester 1')}</SelectItem>
                <SelectItem value="2">{t('Semester 2')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="credit_hours" className="required">
            {t('Credit Hours')}
          </Label>
          <Input
            id="credit_hours"
            name="credit_hours"
            type="number"
            min="1"
            max="6"
            value={formData.credit_hours}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="academic_year" className="required">
            {t('Academic Year')}
          </Label>
          <Input
            id="academic_year"
            name="academic_year"
            value={academicYearValue || t('Select Academic Year')}
            disabled
          />
          {errors.academic_year && (
            <p className="text-sm text-destructive">{errors.academic_year}</p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="professor_id" className="required">
            {t('Professor')}
          </Label>
          {professors.length > 0 ? (
            <Select 
              value={formData.professor_id} 
              onValueChange={(value) => handleSelectChange('professor_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Professor')} />
              </SelectTrigger>
              <SelectContent>
                {professors.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.first_name} {prof.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-gray-500">{t('No Professor')}</div>
          )}
          {errors.professor_id && (
            <p className="text-sm text-destructive">{errors.professor_id}</p>
          )}
        </div>
        
        {/* Department field for Level 3 or 4 */}
        {(formData.level === '3' || formData.level === '4') && (
          <div className="grid gap-2">
            <Label htmlFor="department" className="required">
              {t('Department')}
            </Label>
            <Select
              value={formData.department}
              onValueChange={value => handleSelectChange('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select Department')} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {t(dept.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('Saving...') : (initialData ? t('Update') : t('Create'))}
        </Button>
      </DialogFooter>
    </form>
  );
}