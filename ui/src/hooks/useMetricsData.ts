import { useState, useEffect } from 'react';
import { fetchDeployFrequency, fetchLeadTime, fetchChangeFailureRate, fetchMTTR } from '../api/endpoints/dora';

export const useDeployFrequency = (timeRange: string, team: string, repo: string) => {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchDeployFrequency(timeRange, team, repo).then((values: unknown[]) => { setData(values); setLoading(false); });
  }, [timeRange, team, repo]);
  return { data, loading };
};

export const useLeadTime = (timeRange: string) => {
  const [data, setData] = useState<unknown[]>([]);
  useEffect(() => { fetchLeadTime(timeRange).then(setData); }, [timeRange]);
  return { data };
};

export const useChangeFailureRate = (timeRange: string) => {
  const [data, setData] = useState<unknown[]>([]);
  useEffect(() => { fetchChangeFailureRate(timeRange).then(setData); }, [timeRange]);
  return { data };
};

export const useMTTR = (timeRange: string) => {
  const [data, setData] = useState<unknown[]>([]);
  useEffect(() => { fetchMTTR(timeRange).then(setData); }, [timeRange]);
  return { data };
};
