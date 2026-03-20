import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { llm, visionLlm } from './llm.js';
import { schemeChain, profileChain, marketChain, doctorChain, recommendationChain } from './chains.js';
import PMScheme from '../../model/PMSchemes.js';
import User from '../../model/User.js';
import * as browser from '../agent/browserTools.js';
import AgentLog from '../../model/AgentLog.js';
import PageData from '../../model/PageData.js';
import { fetchSchemes, getMandiData, getDiseaseData, getCropRecommendationData } from './dataLoader.js';

// --- State Definition ---
const ChatState = Annotation.Root({
    query: Annotation<string>,
    user_aadhaar: Annotation<string | null>,
    user_data: Annotation<any>,
    scheme_data: Annotation<any>,
    mandi_data: Annotation<any>,
    disease_data: Annotation<any>,
    recommendation_data: Annotation<any>,
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

    const queryLower = state.query.toLowerCase();

    // Pre-check: if any browse keyword is present, force browse
    const hasBrowseIntent = BROWSE_KEYWORDS.some(kw => queryLower.includes(kw));
    if (hasBrowseIntent) {
        console.log(`  Router: "${state.query}" → browse (keyword match)`);
        return { category: 'browse' };
    }

    // Otherwise, ask LLM for classification
    const prompt = `Categorize this message into ONE word:
- 'scheme': Questions about government schemes that can be answered from a database.
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

// --- Data Fetcher (MongoDB-first, JSON fallback) ---
async function fetchDataNode(state: typeof ChatState.State) {
    let user_data = null;
    let scheme_data = null;
    let mandi_data = null;
    let disease_data = null;
    let recommendation_data = null;

    if (state.category === 'profile' && state.user_aadhaar) {
        const user = await User.findOne({ aadhaarCard: state.user_aadhaar }).lean();
        if (user) {
            const u: any = { ...user, _id: String(user._id) };
            delete u.sixDigitPin;
            user_data = u;
        }
    } else if (state.category === 'scheme') {
        // Uses MongoDB-first with temp_data.json fallback
        scheme_data = await fetchSchemes(state.query);
    } else if (state.category === 'market') {
        mandi_data = getMandiData(state.query);
    } else if (state.category === 'doctor') {
        disease_data = getDiseaseData(state.query);
    } else if (state.category === 'recommend') {
        recommendation_data = getCropRecommendationData(state.query);
    }

    return { user_data, scheme_data, mandi_data, disease_data, recommendation_data };
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
    const mandiContext = state.mandi_data && state.mandi_data.length > 0
        ? JSON.stringify(state.mandi_data)
        : null;
    const response = await marketChain.invoke({
        query: state.query,
        mandi_data: mandiContext ?? 'Live mandi data unavailable.'
    });
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
    const prompt = `You are CropWise AI, a highly knowledgeable agricultural assistant for Indian farmers. You have expertise across agronomy, veterinary science, government schemes, market economics, and rural technology.

Farmer's Question: "${state.query}"

Instructions:
- Answer directly and practically. Farmers need action, not theory.
- If the question is agricultural, structure your answer clearly with headings.
- If the question is about something outside agriculture (greetings, general queries), respond warmly and briefly — then guide back to how CropWise can help the farmer.
- Use simple Hindi-English friendly language. Avoid jargon.
- End every response with one actionable suggestion or helpful tip for the farmer.

Respond thoughtfully and helpfully:`;
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : '' };
}

async function plannerExpert(state: typeof ChatState.State) {
    console.log(`  📅 Planner Expert generating schedule...`);
    const input = state.planner_input || {};
    const crop      = input.cropType   || 'Mixed crops';
    const soil      = input.soilType   || 'Loamy soil';
    const size      = input.farmSize   || '1 acre';
    const sowDate   = input.sowingDate || 'this week';
    const state_loc = input.state      || 'India';
    const water     = input.irrigation || 'canal/tube-well';

    const prompt = `You are YOJAK (Yield Optimization & Journey Advisor for Kisan), a master farm planning expert. You create scientifically precise, profit-maximizing seasonal farm plans for Indian farmers.

════ FARM PROFILE ════
Crop: ${crop}
Soil Type: ${soil}
Farm Size: ${size}
Sowing Date / Start: ${sowDate}
Location / State: ${state_loc}
Irrigation Source: ${water}
═════════════════════

Your task: Generate a COMPLETE, SCIENTIFICALLY DETAILED, PROFIT-FOCUSED farming schedule.

══ PLANNING METHODOLOGY ══
STEP 1 — SEASON ANALYSIS: What season does the sowing date fall in? What are the climate risks for this crop in this season?
STEP 2 — CROP LIFECYCLE: Map out the full growth stages: germination → vegetative → flowering → fruiting → maturity → harvest.
STEP 3 — CRITICAL DATES: Calculate exact dates for each intervention (fertilizer, irrigation, pesticide) based on sowing date.
STEP 4 — RESOURCE BUDGET: How much fertilizer, water, labour, and money is needed? Per acre breakdown.
STEP 5 — YIELD PROJECTION: Realistic expected yield range and market value at harvest.
════════════════════════════

Format your response with these EXACT Markdown headings:

## 1. Seasonal Strategy
[Season, climate context, 3 key success factors for this crop in this soil]

## 2. Critical Milestones
[Table with columns: Week/Date | Activity | Quantity/Dose | Purpose]

## 3. Resource Management
[Breakdown: Seeds (kg/acre), Fertilizers (type + kg + timing), Irrigation (frequency + litres), Labour (person-days), Estimated Cost (₹/acre)]

## 4. 📊 Analytics & Projections
[Include BOTH of these CHART tags exactly:]
[CHART: Bar, Expected Yield (kg/month), Month 1: 0, Month 2: 0, Month 3: 200, Month 4: 800, Month 5: 1500]
[CHART: Area, Expense Breakdown (₹), Seeds: 3000, Fertilizer: 4500, Labour: 5000, Pesticides: 2000, Irrigation: 1500]
[Profit Projection table: Input Cost vs Expected Revenue vs Net Profit per acre]

## 5. Risk Mitigation
[Top 3 risks for this crop/season + specific mitigation actions + insurance schemes available]

Be precise with dates. Use ₹ for Indian Rupees. Write as if advising a smart, modern farmer who is running a business.`;
    
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : 'Plan generated.' };
}

async function mandiExpert(state: typeof ChatState.State) {
    console.log(`  📊 Mandi Expert analyzing prices...`);
    // Use fetched mandi_data if available, else fall back to embedded static context
    let mandiContext: string;
    if (state.mandi_data && state.mandi_data.length > 0) {
        mandiContext = JSON.stringify(state.mandi_data, null, 2);
    } else {
        mandiContext = "Wheat: ₹2,275/quintal, Rice: ₹2,183/quintal, Potato: ₹1,540/quintal. Trend: Market peaking for Wheat.";
    }
    const prompt = `Based on these Mandi prices and trends:\n${mandiContext}\n\nAnswer the user's market question: "${state.query}".
Provide expert advice on when to sell, risks, best crops to sow for profit in the next season.`;
    
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : 'Mandi analysis complete.' };
}

async function weatherExpert(state: typeof ChatState.State) {
    console.log(`  ☁️ Weather Expert checking conditions...`);
    const weatherInfo = "Current Temp: 28°C, Humidity: 65%, Forecast: Light rain expected in 2 days.";
    const prompt = `You are VAYU (Vegetation & Agricultural Yield Updater), a precision agriculture weather specialist.

Current Weather Conditions: ${weatherInfo}

Original Agricultural Advice: ${state.response || 'None provided yet.'}

Farmer's Query Context: "${state.query}"

Your task: Intelligently integrate the weather data into the agricultural advice.

Think through:
1. Does the upcoming rain affect irrigation scheduling? (cancel next watering session?)
2. Does humidity (65%) create disease risk? (fungal conditions?)
3. Does temperature (28°C) affect pesticide application? (avoid spraying in heat)
4. Should the farmer expedite or delay any planned activities?
5. Are there specific weather-smart actions to take in the next 48 hours?

If the original advice is 'None', generate fresh weather-integrated agricultural guidance from scratch.

Output the enhanced advice, naturally incorporating weather insights as actionable adjustments. Keep all original advice sections but add a:

## ☁️ Weather Advisory (Next 48 Hours)
[Specific actions or schedule adjustments based on current conditions]`;
    
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : state.response };
}

async function visionExpert(state: typeof ChatState.State) {
    console.log(`  👁️ Vision Expert analyzing image...`);
    const prompt = `You are DR. FASAL VISION — an AI crop health specialist trained to diagnose plant diseases, pest infestations, and nutrient deficiencies from photographs. You combine the skills of a plant pathologist, entomologist, and remote sensing specialist.

Critical Instructions:
1. ANALYZE the image systematically: leaf color, texture, lesion pattern, affected plant parts, spread pattern.
2. Do NOT say "I cannot diagnose" — always provide your best clinical assessment with a confidence level.
3. Give BOTH chemical AND organic treatment protocols.
4. Estimate URGENCY: How fast is this spreading? How many days before significant crop loss?
5. Use Indian brand names for pesticides/fungicides where possible.

Farmer's Additional Context: "${state.query}"

Respond with EXTREME DETAIL using these exact headings:

## 🚦 Urgency Level
[🔴 CRITICAL — act within 24-48 hours / 🟡 MODERATE — act within 1 week / 🟢 MILD — monitor]
[One sentence on estimated time to significant crop loss if untreated]

## 🔬 Visual Diagnosis
**Primary Diagnosis:** [Disease/pest name] — Confidence: [High/Medium/Low]
**Secondary Possibility:** [If applicable]
[What specific visual features in the image led to this diagnosis]

## 👁️ Symptom Pattern Analysis
[Detailed description of what you observe: color changes, lesion shape, spread pattern, affected plant parts]
[What this pattern tells us about the pathogen's life stage]

## ⚗️ Chemical Treatment Protocol
| Product (Brand) | Active Ingredient | Dose per 15L pump | Spray Interval |
|----------------|-------------------|-------------------|----------------|
[Fill table with 2-3 specific products. Include safety warnings.]

## 🌿 Organic / Bio Treatment
[2-3 specific organic solutions with preparation method, concentration, and frequency]

## 🚫 Common Mistakes to Avoid
[What farmers typically do wrong when treating this problem]

## 🛡️ Spread Control — Do This NOW
[Immediate steps to stop the problem spreading to healthy plants]

## 🔄 Long-term Prevention
[Crop rotation, resistant varieties, cultural practices for next season]`;
    
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
    
    // High Signal (Path A)
    if (!state.dialect || state.dialect.toLowerCase() === 'english') {
        return { response: state.response };
    }
    
    console.log(`  🗣️ Dialect/Guardrail (High Signal) → ${state.dialect}`);
    const prompt = `Rewrite the following agricultural advice in the "${state.dialect}" dialect (e.g., Khariboli or Braj). Use a supportive, elder-brotherly tone. Make it Voice-First and Speech-Ready (simple sentences, avoid complex tables, use natural phrasing for Text-to-Speech). Preserve any Markdown links if present.
Advice: ${state.response}`;
    const res = await llm.invoke(prompt);
    return { response: typeof res.content === 'string' ? res.content : state.response };
}

// --- Browse Expert: Offline-first local navigator ---
// Internal sitemap of the CropWise application — NO LLM NEEDED for matching
const APP_BASE = 'http://127.0.0.1:5281';
const APP_SITEMAP: Record<string, { path: string; description: string }> = {
    'home': { path: '/', description: 'Main dashboard and landing page' },
    'old home': { path: '/old-home', description: 'Original hero section' },
    'pm schemes': { path: '/pm-kisan', description: 'PM Kisan and other government schemes for farmers' },
    'schemes': { path: '/pm-kisan', description: 'Government schemes, benefits, eligibility' },
    'pm kisan': { path: '/pm-kisan', description: 'PM Kisan Yojana scheme details' },
    'kisan': { path: '/pm-kisan', description: 'PM Kisan Yojana' },
    'login': { path: '/login', description: 'User login page' },
    'signup': { path: '/signup', description: 'User registration page' },
    'register': { path: '/signup', description: 'New user registration' },
    'dashboard': { path: '/', description: 'Main user dashboard with analytics and data' },
    'crop recommendation': { path: '/crop-recommendation', description: 'AI-powered crop recommendations' },
    'crop': { path: '/crop-recommendation', description: 'Crop recommendations' },
    'smart mandi': { path: '/smart-mandi', description: 'Smart Mandi market prices' },
    'mandi': { path: '/smart-mandi', description: 'Market prices and crop selling info' },
    'market': { path: '/smart-mandi', description: 'Market prices' },
    'calendar': { path: '/calendar', description: 'Farming planning calendar' },
    'plan': { path: '/calendar', description: 'Planning calendar' },
};

async function browseExpert(state: typeof ChatState.State) {
    console.log(`  🌐 Local Navigator for: "${state.query}"`);
    const queryLower = state.query.toLowerCase();

    // Check if user pasted an external URL
    const externalUrl = state.query.match(/https?:\/\/[^\s"'<>]+/)?.[0];

    try {
        let targetUrl: string;
        let isInternal = true;
        let matchedSection = '';

        if (externalUrl) {
            targetUrl = externalUrl;
            isInternal = false;
        } else {
            // ── FULLY OFFLINE: Keyword match against sitemap ──
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
            const page = APP_SITEMAP[bestMatch];
            if (page && bestScore > 0) {
                targetUrl = APP_BASE + page!.path;
                matchedSection = bestMatch;
            } else {
                targetUrl = APP_BASE;
                matchedSection = 'home';
            }
            console.log(`  → Matched: "${matchedSection}" → ${targetUrl}`);
        }

        // ── OFFLINE: Use Playwright to read the page (no internet needed for localhost) ──
        const openResult = await browser.openPage(targetUrl);
        if (openResult.status === 'error') {
            await browser.closeBrowser();
            return { response: `❌ Couldn't open ${targetUrl}. Make sure the app is running with \`npm run dev\`.\nError: ${openResult.error}` };
        }

        const pageData = await browser.extractPageContent();
        await browser.closeBrowser();

        if ('error' in pageData) {
            return { response: `❌ Opened the page but couldn't read it: ${pageData.error}` };
        }

        const pd = pageData as any;

        // ── OFFLINE: Format the response without any LLM ──
        const headings = (pd.headings || []).map((h: any) => `  • ${h.text}`).join('\n');
        const navLinks = (pd.links || []).slice(0, 8).map((l: any) => `  • [${l.text}](${l.href})`).join('\n');
        const buttons = (pd.buttons || []).filter((b: any) => b.text).map((b: any) => `  • ${b.text}`).join('\n');
        const formCount = (pd.forms || []).length;
        const readableSnippet = (pd.readable_text || '').slice(0, 1500);

        let response = `🌐 **I navigated to ${isInternal ? 'CropWise' : ''} "${pd.title || targetUrl}"**\n\n`;
        response += `**URL:** ${pd.url || targetUrl}\n\n`;

        if (headings) response += `**Sections found:**\n${headings}\n\n`;
        if (readableSnippet) response += `**Page Content:**\n${readableSnippet}\n\n`;
        if (navLinks) response += `**Links available:**\n${navLinks}\n\n`;
        if (buttons) response += `**Actions available:**\n${buttons}\n\n`;
        if (formCount > 0) response += `**Forms:** ${formCount} form(s) detected on this page.\n\n`;

        // Optionally enhance with LLM if available (non-blocking)
        try {
            const summary = await llm.invoke(
                `Briefly summarize this CropWise page in 2-3 sentences for a farmer. Page title: "${pd.title}", headings: ${headings}. Content snippet: ${readableSnippet.slice(0, 500)}`
            );
            const summaryText = typeof summary.content === 'string' ? summary.content : '';
            if (summaryText) response += `**AI Summary:** ${summaryText}\n`;
        } catch {
            // LLM unavailable — that's fine, we already have the content
            response += `_(AI summary unavailable — showing raw page content above)_`;
        }

        // Save to DB (best-effort)
        try {
            await PageData.create({
                taskId: '000000000000000000000000',
                url: targetUrl,
                title: pd.title || '',
                headings: pd.headings || [],
                linksCount: (pd.links || []).length,
                formsCount: formCount,
                analysis: response.slice(0, 1000),
            });
        } catch { /* best-effort */ }

        // The exact redirect path for the frontend router
        const redirectUrl = isInternal ? (APP_SITEMAP[matchedSection]?.path || '/') : targetUrl;

        return { response, redirect: redirectUrl };

    } catch (err: any) {
        console.error('Browse error:', err.message);
        await browser.closeBrowser();
        return { response: `❌ Navigation error: ${err.message}. Make sure the app is running.` };
    }
}

async function doctorExpert(state: typeof ChatState.State) {
    const diseaseContext = state.disease_data && state.disease_data.length > 0
        ? JSON.stringify(state.disease_data, null, 2)
        : 'No specific disease data loaded. Use general plant pathology knowledge.';
    const response = await doctorChain.invoke({
        query: state.query,
        disease_data: diseaseContext
    });
    return { response };
}

async function recommendExpert(state: typeof ChatState.State) {
    const recommendContext = state.recommendation_data && state.recommendation_data.length > 0
        ? JSON.stringify(state.recommendation_data, null, 2)
        : 'No specific recommendation data loaded. Use general Indian agri knowledge.';
    const response = await recommendationChain.invoke({
        query: state.query,
        recommendation_data: recommendContext
    });
    return { response };
}


// --- Routing ---
function routeDirection(state: typeof ChatState.State): string {
    if (state.category === 'vision') return 'vision_expert';
    if (state.category === 'browse') return 'browse_expert';
    if (state.category === 'scheme') return 'scheme_expert';
    if (state.category === 'market') return 'market_expert';
    if (state.category === 'profile') return 'profile_expert';
    if (state.category === 'planner') return 'planner_expert';
    if (state.category === 'doctor') return 'doctor_expert';
    if (state.category === 'recommend') return 'recommend_expert';
    return 'general_expert';
}
const workflow = new StateGraph(ChatState)
    .addNode('router', routerNode)
    .addNode('fetcher', fetchDataNode)
    .addNode('scheme_expert', schemeExpert)
    .addNode('market_expert', marketExpert)
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
    .addEdge('market_expert', 'geospatial')
    .addEdge('profile_expert', 'geospatial')
    .addEdge('general_expert', 'geospatial')
    .addEdge('vision_expert', 'geospatial')
    .addEdge('planner_expert', 'weather_expert')
    .addEdge('weather_expert', 'geospatial')
    .addEdge('doctor_expert', 'geospatial')
    .addEdge('recommend_expert', 'geospatial')
    .addEdge('browse_expert', '__end__') // Browse skips geospatial/dialect to preserve UI markdown
    .addEdge('geospatial', 'dialect_guardrail')
    .addEdge('dialect_guardrail', '__end__');

export const chatGraph = workflow.compile();
