import { useState, useEffect } from 'react';
import { fetchDeployFrequency, fetchLeadTime, fetchChangeFailureRate, fetchMTTR } from '../api/endpoints/dora';
export const useDeployFrequency = (timeRange, team, repo) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchDeployFrequency(timeRange, team, repo).then(values => { setData(values); setLoading(false); });
  }, [timeRange, team, repo]);
  return { data, loading };
};
export const useLeadTime = (timeRange) => {
  const [data, setData] = useState([]);
  useEffect(() => { fetchLeadTime(timeRange).then(setData); }, [timeRange]);
  return { data };
};
export const useChangeFailureRate = (timeRange) => {
  const [data, setData] = useState([]);
  useEffect(() => { fetchChangeFailureRate(timeRange).then(setData); }, [timeRange]);
  return { data };
};
export const useMTTR = (timeRange) => {
  const [data, setData] = useState([]);
  useEffect(() => { fetchMTTR(timeRange).then(setData); }, [timeRange]);
  return { data };
};