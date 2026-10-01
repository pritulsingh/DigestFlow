import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { DataQualityIssue } from '../types';

export function useDataQuality() {
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDataQuality();
      setIssues(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data quality issues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, loading, error, refetch: fetchIssues };
}
