import React from 'react';
import { EventCard } from './EventCard';
import { AICardRenderer } from './AICardRenderer';
import { AutoTranslate } from './AutoTranslate';

interface CalendarViewProps {
  events: any[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
        <AutoTranslate text="No farming tasks scheduled yet. Formulate a plan above to get started." />
      </div>
    );
  }

  // Handle AI Integrated strategy specially
  const aiPlan = events.find((e: any) => e.id?.toString().startsWith('ai-plan'));
  if (aiPlan) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           <div className="h-px bg-white/20 flex-1" />
           <p className="text-xs font-black text-white/60 uppercase tracking-widest px-4 border border-white/20 rounded-full py-1 backdrop-blur-sm">
             <AutoTranslate text="AI Generated Master Plan" />
           </p>
           <div className="h-px bg-white/20 flex-1" />
        </div>
        <AICardRenderer text={aiPlan.description} />
      </div>
    );
  }

  // Group events by month for a simplified Notion-like list/calendar hybrid view
  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const groupedEvents = sortedEvents.reduce((acc: any, event) => {
    const d = new Date(event.startDate);
    const monthKey = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.keys(groupedEvents).map(month => (
        <div key={month} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100"><AutoTranslate text={month} /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedEvents[month].map((event: any) => (
              <EventCard 
                key={event.id}
                event={event}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
