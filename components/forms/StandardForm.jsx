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
import { Checkbox } from '@/components/ui/checkbox';
import { useAcademicYear } from '../../src/contexts/AcademicYearContext';
import { useTranslation } from 'react-i18next';

export default function StandardForm({ initialData, onSubmit, onCancel }) {
  const { apiClient, user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'ACADEMIC',
    assigned_to_ids: initialData?.assigned_to?.map(user => user.id) || [],
  });
  
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        if (user?.role === 'ADMIN') {
        const usersRes = await apiClient('/users/');
        const usersData = await usersRes.json();
        setUsers(usersData.results || []);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };
    fetchFormData();
  }, [apiClient, initialData, user]);
  
  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        type: initialData.type || 'ACADEMIC',
        assigned_to_ids: initialData.assigned_to?.map(user => user.id) || [],
      });
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  const handleUserToggle = (userId) => {
    setFormData((prev) => {
      const currentAssigned = [...prev.assigned_to_ids];
      
      if (currentAssigned.includes(userId)) {
        return { 
          ...prev, 
          assigned_to_ids: currentAssigned.filter(id => id !== userId) 
        };
      } else {
        return { 
          ...prev, 
          assigned_to_ids: [...currentAssigned, userId] 
        };
      }
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!selectedYear) {
      newErrors.academic_year = 'Academic year is required';
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
      await onSubmit({ ...formData, academic_year: selectedYear });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const supervisorUsers = users.filter(
    user => user.role === 'SUPERVISOR' || user.role === 'TA'
  );
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title" className="required">
            {t('Title')}
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('Standard title')}
            required
          />
          {errors.title && (
            <p className="text-sm text-destructive">{t(errors.title)}</p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="type" className="required">
            {t('Type')}
          </Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => handleSelectChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Select type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACADEMIC">{t('Institutional Accreditation Standards')}</SelectItem>
              <SelectItem value="PRAGMATIC">{t('Program Accreditation Standards')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="academic_year" className="required">
            {t('Academic Year')}
          </Label>
          <Input
            id="academic_year"
            name="academic_year"
            value={selectedYear || t('Select academic year')}
            disabled
          />
          {errors.academic_year && (
            <p className="text-sm text-destructive">{t(errors.academic_year)}</p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label>{t('Assigned Users')}</Label>
          <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
            {supervisorUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No users available')}</p>
            ) : (
              <div className="space-y-2">
                {supervisorUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={formData.assigned_to_ids.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label 
                      htmlFor={`user-${user.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {user.username} ({t(user.role)})
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('Cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t('Saving...')}
            </>
          ) : (
            initialData ? t('Update') : t('Create')
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}