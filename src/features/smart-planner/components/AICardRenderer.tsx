import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AutoTranslate } from './AutoTranslate';

interface ChartDataPoint {
  name: string;
  value: number;
}

const ChartRenderer: React.FC<{ tag: string }> = ({ tag }) => {
  try {
    const content = tag.replace('[CHART:', '').replace(']', '').trim();
    const parts = content.split(',').map(s => s.trim());
    const type = parts[0] || 'Bar';
    const title = parts[1] || 'Analytics';
    const data: ChartDataPoint[] = parts.slice(2).map(item => {
      const bits = item.split(':').map(s => s.trim());
      const name = bits[0] || 'Item';
      const value = bits[1] || '0';
      return { name, value: parseFloat(value) || 0 };
    });

    return (
      <div className="mt-8 mb-6 w-full h-[320px] bg-white/50 backdrop-blur-sm rounded-xl p-5 border border-black/5 shadow-inner">
        <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">{title}</p>
        <ResponsiveContainer width="100%" height="90%">
          {type.toLowerCase() === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#059669" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
              <Tooltip 
                 cursor={{ fill: '#00000005' }}
                 contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  } catch (err) {
    return <div className="text-xs text-red-500 italic">Error rendering chart visualization.</div>;
  }
};

export const AICardRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text.includes('## ')) {
    return (
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  }

  const parts = text.split(/(?=## )/g);

  return (
    <div className="flex flex-col gap-6 w-full">
      {parts.map((part, index) => {
        if (!part.trim()) return null;

        if (part.trim().startsWith('## ')) {
          const lines = part.trim().split('\n');
          const title = lines[0]?.replace('## ', '').trim() || '';
          const rawContent = lines.slice(1).join('\n').trim();

          const chartRegex = /\[CHART: [^\]]+\]/g;
          const chartTags = rawContent.match(chartRegex) || [];
          const contentWithoutCharts = rawContent.replace(chartRegex, '').trim();

          return (
            <div key={index} className="bg-white/90 backdrop-blur-lg border border-green-500/20 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group hover:border-green-500/40 transition-all duration-300">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-green-500/10 transition-colors duration-500" />
               <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-black text-lg shadow-lg border border-green-700/20">
                   {index}
                 </div>
                 <h2 className="text-xl font-black text-gray-800 tracking-tight"><AutoTranslate text={title} /></h2>
               </div>
               
               <div className="prose prose-sm max-w-none text-gray-700 relative z-10 prose-p:leading-relaxed prose-li:marker:font-bold prose-li:marker:text-green-600 prose-strong:text-green-700 prose-headings:text-green-800">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentWithoutCharts}</ReactMarkdown>
               </div>

               {chartTags.map((tag, tIdx) => (
                 <ChartRenderer key={tIdx} tag={tag} />
               ))}
            </div>
          );
        }

        return (
           <div key={index} className="prose prose-sm max-w-none text-gray-600 px-4 italic leading-relaxed">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
           </div>
        );
      })}
    </div>
  );
};
