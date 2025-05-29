"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTranslation } from 'react-i18next';

export default function StatsGrid({ loading: parentLoading }) {
  const { apiClient } = useAuth();
  const { t } = useTranslation();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchChartData = async () => {
      if (parentLoading) return;
      
      try {
        setLoading(true);
        
        // Fetch standards by type
        const standardsRes = await apiClient('/standards/');
        const standardsData = await standardsRes.json();
        
        const standards = standardsData.results || [];
        
        // Count standards by type
        const academicCount = standards.filter(s => s.type === 'ACADEMIC').length;
        const pragmaticCount = standards.filter(s => s.type === 'PRAGMATIC').length;
        
        // Create mock data for semester stats
        // In a real scenario, you would fetch this from an endpoint
        setChartData([
          { name: t('Institutional Accreditation Standards'), value: academicCount, fill: 'hsl(var(--chart-1))' },
          { name: t('Program Accreditation Standards'), value: pragmaticCount, fill: 'hsl(var(--chart-2))' },
        ]);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [apiClient, parentLoading, t]);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">{t('Standards Overview')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={({ x, y, payload }) => (
                  <text x={x} y={y + 16} textAnchor="middle" fill="#8884d8" fontSize={14}>{t(payload.value)}</text>
                )} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', padding: 12 }}>
                          <div>{t(payload[0].payload.name)}</div>
                          <div>{t('value')}: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  barSize={60}
                  fill="hsl(var(--chart-1))" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}