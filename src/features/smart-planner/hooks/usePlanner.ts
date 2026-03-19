import { useState, useEffect } from 'react';
import { saveEventsOffline, getOfflineEvents } from '../utils/offlineSync';

export interface PlannerFormInput {
  cropType: string;
  soilType: string;
  location: string;
  farmSize: string;
  sowingDate: string;
  irrigationType: string;
}

export function usePlanner() {
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
  const [monthlyPlan, setMonthlyPlan] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load database or offline data initially
  useEffect(() => {
    fetch('/api/planner/plans')
      .then(res => {
        if (!res.ok) throw new Error('DB fetch failed');
        return res.json();
      })
      .then(dbPlans => {
        if (dbPlans && dbPlans.length > 0) {
          setEvents(dbPlans[0].eventList || []);
        } else {
          loadOfflineFallback();
        }
      })
      .catch(() => loadOfflineFallback());

    function loadOfflineFallback() {
      getOfflineEvents().then((offlineEvents) => {
        if (offlineEvents.length > 0) {
          setEvents(offlineEvents);
        }
      });
    }
  }, []);

  const generatePlan = async (input: PlannerFormInput) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/planner/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }
      
      const data = await response.json();
      setWeeklyPlan(data.weeklyPlan);
      setMonthlyPlan(data.monthlyPlan);
      setEvents(data.eventList);

      // Save offline
      await saveEventsOffline(data.eventList);

    } catch (err: any) {
      console.error(err);
      setError('You are offline or the server is unreachable. Loaded saved plans if available.');
      const offlineEvents = await getOfflineEvents();
      setEvents(offlineEvents);
    } finally {
      setLoading(false);
    }
  };

  return { generatePlan, weeklyPlan, monthlyPlan, events, loading, error };
}
