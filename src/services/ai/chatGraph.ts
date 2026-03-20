import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { llm, visionLlm } from './llm.js';
import { schemeChain, profileChain, marketChain, doctorChain, recommendationChain } from './chains.js';
import PMScheme from '../../model/PMSchemes.js';
import User from '../../model/User.js';
import * as browser from '../agent/browserTools.js';
import AgentLog from '../../model/AgentLog.js';
import PageData from '../../model/PageData.js';

// --- State Definition ---
const ChatState = Annotation.Root({
    query: Annotation<string>,
    user_aadhaar: Annotation<string | null>,
    user_data: Annotation<any>,
    scheme_data: Annotation<any>,
    response: Annotation<string>,
    category: Annotation<string>,
    redirect: Annotation<string | null>,
    openClawActions: Annotation<any[]>,
    
    // Master Agent Telemetry
    connectivity: Annotation<'high' | 'low' | 'zero'>,
    image_data: Annotation<string | null>,
    location: Annotation<{ lat: number; lon: number } | null>,
    dialect: Annotation<string>,

    // Planner Integration
    planner_input: Annotation<any>,
    planner_output: Annotation<any>,
});

// --- Router: detects 'browse' intent with keyword pre-check ---
const BROWSE_KEYWORDS = [
    'navigate', 'find', 'go to', 'open', 'visit', 'explore', 'look up',
    'search for', 'search online', 'browse', 'check website', 'show me',
    'take me to', 'go on', 'look for', 'search the', 'find me',
    'navigate to', 'open the', 'go to the', 'visit the', 'explore the',
];

async function routerNode(state: typeof ChatState.State) {
    if (state.image_data) {
        console.log(`  Router: image detected → vision`);
        return { category: 'vision' };
    }

    if (state.category && state.category !== 'general' && state.category !== '') {
        console.log(`  Router: using pre-set category → ${state.category}`);
        return { category: state.category };
    }

    const queryLower = state.query.toLowerCase();

    // Pre-check: if any browse keyword is present, force browse
    const hasBrowseIntent = BROWSE_KEYWORDS.some(kw => queryLower.includes(kw));
    if (hasBrowseIntent) {
        console.log(`  Router: "${state.query}" → browse (keyword match)`);
        return { category: 'browse' };
    }

    // Otherwise, ask LLM for classification
    const prompt = `Categorize this message into ONE word:
- 'scheme': Questions about government schemes.
- 'market': Questions about Mandi prices or selling crops.
- 'profile': Questions about registration, documents, or Aadhaar.
- 'planner': Questions about farming schedules, what to do next, or planning.
- 'doctor': Questions about crop diseases, pests, health, symptoms, or crop diagnosis.
- 'recommend': Questions about what crop to grow, seeds to plant, or soil suitability.
- 'general': Anything else.

Message: "${state.query}"
Category:`;
    const res = await llm.invoke(prompt);
    const raw = (typeof res.content === 'string' ? res.content : '').trim().toLowerCase();
    const category = ['scheme', 'market', 'profile', 'planner', 'doctor', 'recommend'].find(c => raw.includes(c)) || 'general';
    console.log(`  Router: "${state.query}" → ${category} (LLM)`);
    return { category };
}

// --- Data Fetcher ---
async function fetchDataNode(state: typeof ChatState.State) {
    let user_data = null;
    let scheme_data = null;

    if (state.category === 'profile' && state.user_aadhaar) {
        const user = await User.findOne({ aadhaarCard: state.user_aadhaar }).lean();
        if (user) {
            const u: any = { ...user, _id: String(user._id) };
            delete u.sixDigitPin;
            user_data = u;
        }
    } else if (state.category === 'scheme') {
        scheme_data = await PMScheme.find({
            $or: [
                { schemeName: { $regex: state.query, $options: 'i' } },
                { description: { $regex: state.query, $options: 'i' } }
            ]
        }).limit(3).lean();
    }

    return { user_data, scheme_data };
}

// --- Expert Nodes ---
async function schemeExpert(state: typeof ChatState.State) {
    const response = await schemeChain.invoke({
        query: state.query,
        scheme_data: JSON.stringify(state.scheme_data || [])
    });
    return { response };
}

async function marketExpert(state: typeof ChatState.State) {
    const response = await marketChain.invoke({ query: state.query });
    return { response };
}

async function profileExpert(state: typeof ChatState.State) {
    const response = await profileChain.invoke({
        query: state.query,
        user_data: JSON.stringify(state.user_data || {})
    });
    return { response };
}

async function generalExpert(state: typeof ChatState.State) {
    const res = await llm.invoke(state.query);
    return { response: typeof res.content === 'string' ? res.content : '' };
}

async function plannerExpert(state: typeof ChatState.State) {
    console.log(`  📅 Planner Expert generating schedule...`);
    const input = state.planner_input || {};
    const prompt = `You are the CropWise Planner. Generate a LARGE, EXTREMELY DETAILED farming schedule for ${input.cropType || 'crops'} 
Soil: ${input.soilType || 'standard'}, Farm Size: ${input.farmSize || '1 acre'}, Sowing Date: ${input.sowingDate || 'today'}.

Provide a response formatted with the following proper Markdown topic headings:
## 1. Seasonal Strategy
## 2. Critical Milestones
## 3. Resource Management
## 4. 📊 Analytics & Projections
(In the Analytics section, include a CHART tag in this EXACT format: 
[CHART: Bar, Expected Yield (kg/month), Month 1: 200, Month 2: 450, Month 3: 800, Month 4: 1200]
or
[CHART: Area, Nutrient Requirements, Nitrogen: 40, Phosphorus: 30, Potassium: 50, Micro: 10]
)

## 5. Risk Mitigation

Format rules:
1. Be precise with dates and quantities.
2. Focus on maximizing yield and profit.
3. Use a helpful, professional tone for a modern Indian farmer.`;
    
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : 'Plan generated.' };
}

async function mandiExpert(state: typeof ChatState.State) {
    console.log(`  📊 Mandi Expert analyzing prices...`);
    const mandiContext = "Wheat: ₹2,275/quintal, Rice: ₹2,183/quintal, Potato: ₹1,540/quintal. Trend: Market peaking for Wheat.";
    const prompt = `Based on these Mandi prices: "${mandiContext}", answer the user's market question: "${state.query}".
Provide expert advice on when to sell or which seeds to buy for the next season.`;
    
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : 'Mandi analysis complete.' };
}

async function weatherExpert(state: typeof ChatState.State) {
    console.log(`  ☁️ Weather Expert checking conditions...`);
    const weatherInfo = "Current Temp: 28°C, Humidity: 65%, Forecast: Light rain expected in 2 days.";
    const prompt = `Based on this weather: "${weatherInfo}", adjust the agricultural advice for the user's query: "${state.query}".
Original Advice: ${state.response || 'None'}`;
    
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : state.response };
}

async function visionExpert(state: typeof ChatState.State) {
    console.log(`  👁️ Vision Expert analyzing image...`);
    const prompt = `You are the CropWise Crop Doctor AI. Analyze this crop image for pests, fungal infections, or nutrient deficiencies. Prescribe actionable advice. Do not just "identify"; you must prescribe.
Provide a LARGE, EXTREMELY DETAILED response formatted with the following proper Markdown topic headings:
## 1. Diagnosis
## 2. Symptoms Observed
## 3. Chemical Treatment
## 4. Organic Treatment
## 5. Preventive Measures

User Query: ${state.query}`;
    
    const res = await visionLlm.invoke([
        {
            role: "user",
            content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: state.image_data } }
            ]
        }
    ]);
    return { response: typeof res.content === 'string' ? res.content : 'Image analyzed.' };
}

async function geospatialNode(state: typeof ChatState.State) {
    if (!state.location) return { response: state.response };
    console.log(`  🌐 Geospatial Node adjusting for Lat: ${state.location.lat}, Lon: ${state.location.lon}`);
    const prompt = `Adjust the following advice based on the farmer's GPS coordinates (Lat: ${state.location.lat}, Lon: ${state.location.lon}). Incorporate regional Mandi trends or weather context if relevant.
Original Advice: ${state.response}`;
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : state.response };
}

async function dialectNode(state: typeof ChatState.State) {
    const signal = state.connectivity || 'high';
    
    if (signal === 'zero') {
        console.log(`  📶 Dialect/Guardrail (Zero Signal) → SMS Path C`);
        const prompt = `Rewrite the following advice strictly under 140 characters for SMS transmission. If receiving a hex-code or short query, just give the immediate action.
Advice: ${state.response}`;
        const res = await llm.invoke(prompt);
        return { response: typeof res.content === 'string' ? res.content : state.response.slice(0, 140) };
    } 
    
    if (signal === 'low') {
        console.log(`  📶 Dialect/Guardrail (Low Signal) → Brief Path B`);
        const prompt = `Rewrite the following advice prioritizing brevity. Strip all non-essential metadata. Focus on immediate, actionable "First-Aid" for crops. Use bullet points.
Advice: ${state.response}`;
        const res = await llm.invoke(prompt);
        return { response: typeof res.content === 'string' ? res.content : state.response };
    }
    
    if (!state.dialect || state.dialect.toLowerCase() === 'english') {
        return { response: state.response };
    }
    
    console.log(`  🗣️ Dialect/Guardrail (High Signal) → ${state.dialect}`);
    const prompt = `Rewrite the following agricultural advice in the "${state.dialect}" dialect (e.g., Khariboli or Braj). Use a supportive, elder-brotherly tone. Make it Voice-First and Speech-Ready (simple sentences, avoid complex tables, use natural phrasing for Text-to-Speech). Preserve any Markdown links if present.
Advice: ${state.response}`;
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : state.response };
}

// --- Browse Expert ---
const APP_BASE = 'http://127.0.0.1:5281';
const APP_SITEMAP: Record<string, { path: string; description: string }> = {
    'home': { path: '/', description: 'Main dashboard' },
    'pm schemes': { path: '/pm-kisan', description: 'Government schemes' },
    'crop recommendation': { path: '/crop-recommendation', description: 'AI crop suggestions' },
    'smart mandi': { path: '/smart-mandi', description: 'Market prices' },
    'calendar': { path: '/calendar', description: 'Farming calendar' },
};

async function browseExpert(state: typeof ChatState.State) {
    console.log(`  🌐 Local Navigator for: "${state.query}"`);
    const queryLower = state.query.toLowerCase();
    const externalUrl = state.query.match(/https?:\/\/[^\s"'<>]+/)?.[0];

    try {
        let targetUrl: string;
        let isInternal = true;
        let matchedSection = '';

        if (externalUrl) {
            targetUrl = externalUrl;
            isInternal = false;
        } else {
            let bestMatch = '';
            let bestScore = 0;
            for (const [keyword, page] of Object.entries(APP_SITEMAP)) {
                const words = keyword.split(' ');
                const score = words.filter(w => queryLower.includes(w)).length;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = keyword;
                }
            }
            if (bestMatch && bestScore > 0) {
                targetUrl = APP_SITEMAP[bestMatch]?.path || '';
                matchedSection = bestMatch;
            } else {
                targetUrl = '/';
                matchedSection = 'home';
            }
        }

        // OpenClaw LLM Action Generation
        const prompt = `You are the OpenClaw UI Automation Agent for CropWise.
The user's command is: "${state.query}"

Your goal is to generate a sequence of UI actions to execute this command.
The best matching internal route is: "${targetUrl}"

Available OpenClaw Actions:
{"type": "NAVIGATE", "target": "/path"}
{"type": "SCROLL", "target": "bottom" | "top" | "css-selector"}
{"type": "HIGHLIGHT", "target": "css-selector"}
{"type": "CLICK", "target": "css-selector"}
{"type": "TYPE", "target": "css-selector", "text": "string"}
{"type": "WAIT", "duration": milliseconds}

Selector Registry:
- Crop Recommendation Page (/crop-recommendation):
  - Input: "#crop-recommendation-input"
  - Submit: '#crop-recommendation-submit'
  - Page Title: "h1"

Return a valid JSON array of actions.
MUST RETURN ONLY VALID JSON ARRAY, NO TEXT OR MARKDOWN.
Do NOT use single quotes for JSON keys or values.

Example for "search for Tomato in crop recommendation":
[
  {"type": "NAVIGATE", "target": "/crop-recommendation"},
  {"type": "WAIT", "duration": 1500},
  {"type": "TYPE", "target": "#crop-recommendation-input", "text": "Tomato information"},
  {"type": "CLICK", "target": "#crop-recommendation-submit"},
  {"type": "WAIT", "duration": 2000},
  {"type": "HIGHLIGHT", "target": "h1"}
]`;

        const res = await llm.invoke(prompt);
        const content = typeof res.content === 'string' ? res.content : '[]';
        
        let actions = [];
        try {
            const match = content.match(/\[[\s\S]*\]/);
            if (match) {
                actions = JSON.parse(match[0]);
            } else {
                // Fallback action
                actions = [{ type: "NAVIGATE", target: targetUrl }];
            }
        } catch {
            actions = [{ type: "NAVIGATE", target: targetUrl }];
        }

        const responseMsg = isInternal 
            ? `Autonomously navigating you to ${matchedSection || 'the page'}...` 
            : `I cannot autonomously navigate external sites. Opening ${targetUrl} for you.`;

        return { response: responseMsg, openClawActions: isInternal ? actions : undefined, redirect: isInternal ? null : targetUrl };

    } catch (err: any) {
        console.error('OpenClaw error:', err.message);
        return { response: `❌ Navigation error: ${err.message}` };
    }
}

function routeDirection(state: typeof ChatState.State): string {
    if (state.category === 'vision') return 'vision_expert';
    if (state.category === 'browse') return 'browse_expert';
    if (state.category === 'scheme') return 'scheme_expert';
    if (state.category === 'market') return 'mandi_expert';
    if (state.category === 'profile') return 'profile_expert';
    if (state.category === 'planner') return 'planner_expert';
    if (state.category === 'doctor') return 'doctor_expert';
    if (state.category === 'recommend') return 'recommend_expert';
    return 'general_expert';
}

async function doctorExpert(state: typeof ChatState.State) {
    const response = await doctorChain.invoke({ query: state.query });
    return { response };
}

async function recommendExpert(state: typeof ChatState.State) {
    const response = await recommendationChain.invoke({ query: state.query });
    return { response };
}

const workflow = new StateGraph(ChatState)
    .addNode('router', routerNode)
    .addNode('fetcher', fetchDataNode)
    .addNode('scheme_expert', schemeExpert)
    .addNode('mandi_expert', mandiExpert)
    .addNode('profile_expert', profileExpert)
    .addNode('general_expert', generalExpert)
    .addNode('browse_expert', browseExpert)
    .addNode('vision_expert', visionExpert)
    .addNode('planner_expert', plannerExpert)
    .addNode('weather_expert', weatherExpert)
    .addNode('doctor_expert', doctorExpert)
    .addNode('recommend_expert', recommendExpert)
    .addNode('geospatial', geospatialNode)
    .addNode('dialect_guardrail', dialectNode)
    .addEdge('__start__', 'router')
    .addEdge('router', 'fetcher')
    .addConditionalEdges('fetcher', routeDirection)
    .addEdge('scheme_expert', 'geospatial')
    .addEdge('mandi_expert', 'geospatial')
    .addEdge('profile_expert', 'geospatial')
    .addEdge('general_expert', 'geospatial')
    .addEdge('vision_expert', 'geospatial')
    .addEdge('planner_expert', 'weather_expert')
    .addEdge('weather_expert', 'geospatial')
    .addEdge('doctor_expert', 'geospatial')
    .addEdge('recommend_expert', 'geospatial')
    .addEdge('browse_expert', '__end__') 
    .addEdge('geospatial', 'dialect_guardrail')
    .addEdge('dialect_guardrail', '__end__');

export const chatGraph = workflow.compile();
