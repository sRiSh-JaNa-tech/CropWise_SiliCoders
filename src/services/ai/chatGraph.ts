import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { llm, visionLlm } from './llm.js';
import { schemeChain, profileChain, marketChain } from './chains.js';
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
    
    // Master Agent Telemetry
    connectivity: Annotation<'high' | 'low' | 'zero'>,
    image_data: Annotation<string | null>,
    location: Annotation<{ lat: number; lon: number } | null>,
    dialect: Annotation<string>,
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
- 'general': Anything else.

Message: "${state.query}"
Category:`;
    const res = await llm.invoke(prompt);
    const raw = (typeof res.content === 'string' ? res.content : '').trim().toLowerCase();
    const category = ['scheme', 'market', 'profile'].find(c => raw.includes(c)) || 'general';
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

// --- Master Agent Nodes ---
async function visionExpert(state: typeof ChatState.State) {
    console.log(`  👁️ Vision Expert analyzing image...`);
    const prompt = `Analyze this crop image for pests, fungal infections, or nutrient deficiencies. Prescribe actionable advice. Do not just "identify"; you must prescribe.
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
            if (bestMatch && bestScore > 0) {
                targetUrl = APP_BASE + APP_SITEMAP[bestMatch].path;
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

// --- Routing ---
function routeDirection(state: typeof ChatState.State): string {
    if (state.category === 'vision') return 'vision_expert';
    if (state.category === 'browse') return 'browse_expert';
    if (state.category === 'scheme') return 'scheme_expert';
    if (state.category === 'market') return 'market_expert';
    if (state.category === 'profile') return 'profile_expert';
    return 'general_expert';
}

// --- Build Graph ---
const workflow = new StateGraph(ChatState)
    .addNode('router', routerNode)
    .addNode('fetcher', fetchDataNode)
    .addNode('scheme_expert', schemeExpert)
    .addNode('market_expert', marketExpert)
    .addNode('profile_expert', profileExpert)
    .addNode('general_expert', generalExpert)
    .addNode('browse_expert', browseExpert)
    .addNode('vision_expert', visionExpert)
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
    .addEdge('browse_expert', '__end__') // Browse skips geospatial/dialect to preserve UI markdown
    .addEdge('geospatial', 'dialect_guardrail')
    .addEdge('dialect_guardrail', '__end__');

export const chatGraph = workflow.compile();
