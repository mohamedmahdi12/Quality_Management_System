"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { format } from 'date-fns';
import { 
  FileText, Calendar, ClipboardList, Share2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTranslation } from 'react-i18next';

export default function RecentActivity({ loading: parentLoading }) {
  const { apiClient } = useAuth();
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivity = async () => {
      if (parentLoading) return;
      
      try {
        setLoading(true);
        
        // Combined fetch of different entities for activity feed
        const [
          standardsRes,
          attachmentsRes,
          requestsRes
        ] = await Promise.all([
          apiClient('/standards/?page=1'),
          apiClient('/attachments/?page=1'),
          apiClient('/requests/?page=1')
        ]);
        
        const standardsData = await standardsRes.json();
        const attachmentsData = await attachmentsRes.json();
        const requestsData = await requestsRes.json();
        
        // Create activity items from each entity
        const activityItems = [
          ...standardsData.results.map(item => ({
            id: `standard-${item.id}`,
            type: 'standard',
            title: item.title,
            date: new Date(item.created_at),
            icon: ClipboardList
          })),
          ...attachmentsData.results.map(item => ({
            id: `attachment-${item.id}`,
            type: 'attachment',
            title: item.title,
            date: new Date(item.created_at),
            icon: FileText,
            user: item.uploaded_by?.username
          })),
          ...requestsData.results.map(item => ({
            id: `request-${item.id}`,
            type: 'request',
            status: item.status,
            date: new Date(item.created_at),
            icon: Share2,
            from: item.requester?.username,
            to: item.receiver?.username
          }))
        ];
        
        // Sort by date (newest first) and take most recent 5
        activityItems.sort((a, b) => b.date - a.date);
        setActivities(activityItems.slice(0, 5));
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [apiClient, parentLoading]);
  
  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'standard':
        return t('New standard created: {{title}}', { title: activity.title });
      case 'attachment':
        return t('New attachment uploaded: {{title}} by {{user}}', { title: activity.title, user: activity.user || t('a user') });
      case 'request':
        return t('Request {{status}} from {{from}} to {{to}}', {
          status: t(activity.status?.toUpperCase()),
          from: activity.from || t('a user'),
          to: activity.to || t('a user')
        });
      default:
        return t('Unknown activity');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Recent Activity')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner />
        ) : activities.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No recent activity found</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-2">
                <activity.icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div>{getActivityText(activity)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(activity.date, 'MMM d, yyyy, h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}