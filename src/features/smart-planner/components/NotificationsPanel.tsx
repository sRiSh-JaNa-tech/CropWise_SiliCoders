import React from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { AutoTranslate } from './AutoTranslate';

interface NotificationsPanelProps {
  events: any[];
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ events }) => {
  // Find events occurring today or tomorrow
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcoming = events.filter(e => {
    if (!e.reminder) return false;
    const d = new Date(e.startDate);
    return d >= new Date(now.getTime() - 86400000) && d <= tomorrow;
  });

  return (
    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-green-700" />
        <h3 className="font-bold text-green-900"><AutoTranslate text="Important Reminders" /></h3>
      </div>
      
      {upcoming.length === 0 ? (
        <p className="text-sm text-green-800 opacity-80"><AutoTranslate text="No immediate tasks due today or tomorrow." /></p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map(item => (
            <li key={`alert-${item.id}`} className="bg-white p-3 rounded-lg shadow-sm border border-green-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm text-gray-900"><AutoTranslate text={item.title} /></strong>
                <span className="text-xs text-gray-600 block mt-1"><AutoTranslate text={item.description} /></span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
