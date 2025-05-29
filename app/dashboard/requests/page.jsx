'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTranslation } from 'react-i18next';

export default function RequestsPage() {
  const { apiClient, user } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'ADMIN';

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/requests/');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  // Actions
  const handleAction = async (id, action) => {
    try {
      const res = await apiClient(`/requests/${id}/${action}/`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.detail || 'Failed to update request');
        return;
      }
      fetchRequests();
    } catch (err) {
      alert('Failed to update request');
    }
  };

  if (loading) return <LoadingSpinner className="mx-auto mt-10" />;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 dark:bg-gray-900 dark:text-gray-100 p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">{t('Requests')}</h1>
      {requests.length === 0 ? (
        <div className="text-gray-500 text-center dark:text-gray-400">{t('No requests found.')}</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border dark:bg-gray-800 dark:border-gray-700">
              <div>
                <div className="font-semibold text-lg mb-1 dark:text-gray-100">{req.made_on?.title || t('Attachment')}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('From')}: <span className="font-medium">{req.requester?.username}</span></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('To')}: <span className="font-medium">{req.receiver?.username}</span></div>
                <div className="text-sm dark:text-gray-400">{t('Status')}: <span className="font-bold text-blue-700 dark:text-blue-400">{t(req.status.toUpperCase())}</span></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* زر Approve/Reject للمستقبل فقط (وليس Admin) */}
                {req.status === 'PENDING' && user?.id === req.receiver?.id && (
                  <>
                    <Button size="sm" className="bg-green-500 text-white" onClick={() => handleAction(req.id, 'approve')}>{t('Approve')}</Button>
                    <Button size="sm" className="bg-red-500 text-white" onClick={() => handleAction(req.id, 'reject')}>{t('Reject')}</Button>
                  </>
                )}
                {/* زر Cancel للراسل فقط (وليس Admin) */}
                {req.status === 'PENDING' && user?.id === req.requester?.id && (
                  <Button size="sm" variant="outline" onClick={() => handleAction(req.id, 'cancel')}>{t('Cancel')}</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 