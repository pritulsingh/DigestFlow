import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { Signal, Project, Run } from '../types';

export function useSourceData(selectedProject?: string) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [signalsData, projectsData, runsData] = await Promise.all([
        apiClient.getSignals(selectedProject),
        apiClient.getProjects(),
        apiClient.getRuns(),
      ]);
      setSignals(signalsData);
      setProjects(projectsData);
      setRuns(runsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load source data from backend API');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { signals, projects, runs, loading, error, refetch: fetchData };
}
