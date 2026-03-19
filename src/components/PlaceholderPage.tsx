import React from 'react';
import { LucideIcon, Wrench } from 'lucide-react';

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon: Icon = Wrench }) => {
  return (
    <section className="min-h-[calc(100vh-80px)] p-6 md:p-10 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-br from-surface/70 via-black/30 to-surface/40 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
            <p className="mt-3 text-base leading-relaxed text-green-100/70">{description}</p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-gray-300">
              This module is being aligned to the same production UI system as the Crop Recommendation flow.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlaceholderPage;
