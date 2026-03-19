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

  const generatePlan = async (input: PlannerFormInput & { aiMode?: boolean }) => {
    setLoading(true);
    setError('');
    try {
      if (input.aiMode) {
        // AI-Powered Generation
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `Generate a full farming schedule for ${input.cropType} in ${input.location}. Sowing date: ${input.sowingDate}. Soil: ${input.soilType}. Size: ${input.farmSize}.`,
            planner_input: input
          })
        });
        if (!response.ok) throw new Error('AI Generation failed');
        const data = await response.json();
        
        // Convert AI response to "events" structure for the UI
        // Since the AI returns text, we'll try to parse it or just show the suggestion feed
        // For a seamless experience, we'll use a mocked "AI Event" list for now or let the user see the text.
        setEvents([{
          id: 'ai-plan-0',
          title: 'AI Integrated strategy',
          startDate: input.sowingDate,
          endDate: input.sowingDate,
          description: data.response,
          priority: 'high',
          icon: 'bot',
          reminder: true,
          tips: "Follow AI strategy for optimized yield."
        }]);
      } else {
        // Standard Generation
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
      }

    } catch (err: any) {
      console.error(err);
      setError('You are offline or the server is unreachable. Loaded saved plans if available.');
      const offlineEvents = await getOfflineEvents();
      setEvents(offlineEvents);
    } finally {
      setLoading(false);
    }
  };

  const getAiSuggestions = async () => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "Suggest 5 advanced optimization tips for my current farming schedule based on weather and mandi trends.",
          planner_input: events[0] || {} // Use the first event/plan as context
        })
      });
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      return data.response;
    } catch (err) {
      throw err;
    }
  };

  return { generatePlan, weeklyPlan, monthlyPlan, events, loading, error, getAiSuggestions };
}
