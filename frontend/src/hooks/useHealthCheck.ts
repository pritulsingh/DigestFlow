import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { HealthResponse, SystemInfo } from '../types';

export function useHealthCheck() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const [healthData, systemData] = await Promise.all([
        apiClient.getHealth(),
        apiClient.getSystemInfo(),
      ]);
      setHealth(healthData);
      setSystemInfo(systemData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reach backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return { health, systemInfo, loading, error, refetch: checkHealth };
}
