import React from 'react';
import { Calendar, Droplet, Leaf, Bug, Scissors, Tractor, Plus, Volume2 } from 'lucide-react';
import { AutoTranslate } from './AutoTranslate';

const iconMap: Record<string, React.ReactNode> = {
  droplet: <Droplet className="w-5 h-5" />,
  leaf: <Leaf className="w-5 h-5" />,
  bug: <Bug className="w-5 h-5" />,
  scissors: <Scissors className="w-5 h-5" />,
  tractor: <Tractor className="w-5 h-5" />,
  store: <Plus className="w-5 h-5" /> // fallback
};

interface EventCardProps {
  title: string;
  date: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  tips?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ title, date, description, priority, icon, tips }) => {
  const priorityColors = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Task: ${title}. ${description}. Tips: ${tips || ''}`);
      window.speechSynthesis.speak(msg);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-md ${priorityColors[priority]}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {iconMap[icon] || <Calendar className="w-5 h-5" />}
          <h3 className="font-semibold text-lg"><AutoTranslate text={title} /></h3>
        </div>
        <button onClick={handleSpeech} className="p-1 rounded-full hover:bg-white/50 transition-colors" title="Read Aloud">
           <Volume2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm opacity-90 mb-2"><AutoTranslate text={description} /></p>
      <div className="flex justify-between items-end mt-4">
        <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-full uppercase tracking-wide">
          <AutoTranslate text={`${priority} Priority`} />
        </span>
        <span className="text-sm font-medium">
          {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      {tips && (
        <div className="mt-3 pt-3 border-t border-black/10 text-xs italic">
          <AutoTranslate text={`Tip: ${tips}`} />
        </div>
      )}
    </div>
  );
};
