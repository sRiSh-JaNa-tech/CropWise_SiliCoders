export interface PlannerInput {
  cropType: string;
  soilType: string;
  location: string;
  weatherData?: any;
  farmSize: string;
  sowingDate: string; // ISO date string
  irrigationType: string;
}

export interface FarmingEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  reminder: boolean;
  tips?: string;
}

export interface PlannerOutput {
  weeklyPlan: FarmingEvent[];
  monthlyPlan: FarmingEvent[];
  eventList: FarmingEvent[];
}

const defaultTips = "Apply organic compost if possible.";

const defaultTemplate: { daysAfterSowing: number, title: string, description: string, priority: 'low'|'medium'|'high', icon: string }[] = [
    { daysAfterSowing: 3, title: 'Initial Irrigation', description: 'Light irrigation essential for seed germination.', priority: 'high', icon: 'droplet' },
    { daysAfterSowing: 10, title: 'Fertilizer Application', description: 'Apply base dosage to support early growth.', priority: 'medium', icon: 'leaf' },
    { daysAfterSowing: 25, title: 'Crop Monitoring', description: 'Check for early signs of pests or disease.', priority: 'high', icon: 'bug' },
    { daysAfterSowing: 45, title: 'Weeding', description: 'Remove weeds competing for nutrients.', priority: 'medium', icon: 'scissors' },
    { daysAfterSowing: 90, title: 'Harvest Preparation', description: 'Prepare equipment for harvesting.', priority: 'high', icon: 'tractor' },
];

const cropTemplates: Record<string, { daysAfterSowing: number, title: string, description: string, priority: 'low'|'medium'|'high', icon: string }[]> = {
  Wheat: [
    { daysAfterSowing: 3, title: 'Initial Irrigation', description: 'Light irrigation essential for seed germination.', priority: 'high', icon: 'droplet' },
    { daysAfterSowing: 10, title: 'Fertilizer Application', description: 'Apply NPK base dosage to support early growth.', priority: 'medium', icon: 'leaf' },
    { daysAfterSowing: 25, title: 'Pest Monitoring', description: 'Check for early signs of aphids or rust.', priority: 'high', icon: 'bug' },
    { daysAfterSowing: 35, title: 'Soil Treatment', description: 'Apply micronutrients if soil is deficient.', priority: 'low', icon: 'sprout' },
    { daysAfterSowing: 45, title: 'Weeding', description: 'Remove weeds competing for nutrients.', priority: 'medium', icon: 'scissors' },
    { daysAfterSowing: 90, title: 'Harvest Preparation', description: 'Prepare equipment for harvesting.', priority: 'high', icon: 'tractor' },
    { daysAfterSowing: 100, title: 'Market Preparation', description: 'Contact buyers and prepare transport.', priority: 'high', icon: 'store' },
  ],
  Rice: [
    { daysAfterSowing: 5, title: 'Flooding Field', description: 'Maintain water level for rice paddies.', priority: 'high', icon: 'droplet' },
    { daysAfterSowing: 20, title: 'Fertilizer - Urea Base', description: 'Apply first split of urea.', priority: 'medium', icon: 'leaf' },
    { daysAfterSowing: 40, title: 'Stem Borer Check', description: 'Monitor for stem borers and apply treatment if needed.', priority: 'high', icon: 'bug' },
    { daysAfterSowing: 90, title: 'Drain Field', description: 'Drain water to prepare for harvesting.', priority: 'high', icon: 'droplet' },
    { daysAfterSowing: 110, title: 'Harvesting', description: 'Harvest the mature paddy crop.', priority: 'high', icon: 'tractor' },
  ],
  Corn: defaultTemplate,
  Tomato: defaultTemplate,
  Potato: defaultTemplate,
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function generateFarmingPlan(input: PlannerInput): PlannerOutput {
  const cropStr = Object.keys(cropTemplates).find(k => k.toLowerCase() === input.cropType?.toLowerCase()) || 'Wheat';
  const template = cropTemplates[cropStr] || defaultTemplate;
  
  const sowingDate = new Date(input.sowingDate);
  
  const events: FarmingEvent[] = template.map(task => {
    const taskDate = new Date(sowingDate);
    taskDate.setDate(taskDate.getDate() + task.daysAfterSowing);
    
    return {
      id: generateId(),
      title: task.title,
      startDate: taskDate.toISOString(),
      endDate: taskDate.toISOString(),
      description: task.description,
      priority: task.priority as 'low'|'medium'|'high',
      icon: task.icon,
      reminder: true,
      tips: defaultTips
    };
  });

  // Calculate generic offsets from sowing date for weekly/monthly categorization
  // Normally this would be based on the current date relative to the user's interaction
  // Here we assume the user is looking at the plan starting around the sowing date,
  // or use the current time if the sowing date was in the past.
  const now = new Date();
  
  // Weekly plan tasks (next 7 days from now)
  const oneWeekLater = new Date(now);
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);
  
  const weeklyPlan = events.filter(e => {
    const d = new Date(e.startDate);
    // If it's already past, we might still show it or filter it out.
    // For now, let's include anything happening in the next 7 days or recently active
    return d >= new Date(now.getTime() - 86400000) && d <= oneWeekLater;
  });

  // Monthly plan tasks (next 30 days)
  const oneMonthLater = new Date(now);
  oneMonthLater.setDate(oneMonthLater.getDate() + 30);
  
  const monthlyPlan = events.filter(e => {
    const d = new Date(e.startDate);
    return d <= oneMonthLater;
  });

  return {
    weeklyPlan,
    monthlyPlan,
    eventList: events,
  };
}
