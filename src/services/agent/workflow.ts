/**
 * Autonomous Agent — LangGraph Workflow
 * Planner → Executor → PageAnalyzer → Evaluator → (loop/replan/end)
 */
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { llm } from '../ai/llm.js';
import * as browser from './browserTools.js';
import AgentLog from '../../model/AgentLog.js';
import PageData from '../../model/PageData.js';
import AgentTask from '../../model/AgentTask.js';

// --- State ---
const AgentState = Annotation.Root({
    taskId: Annotation<string>,
    originalTask: Annotation<string>,
    plan: Annotation<string[]>,
    currentStep: Annotation<number>,
    pastSteps: Annotation<string[]>,
    currentUrl: Annotation<string>,
    pageTitle: Annotation<string>,
    pageContent: Annotation<string>,
    pageElements: Annotation<any>,
    status: Annotation<string>,
    finalResponse: Annotation<string>,
    iteration: Annotation<number>,
});

const MAX_ITERATIONS = 15;

// --- Planner ---
async function plannerNode(state: typeof AgentState.State) {
    const pastSummary = (state.pastSteps || []).slice(-5).join('\n') || 'None yet.';

    const prompt = `You are an autonomous web browsing agent. Break this task into 3-8 concrete browser steps.

TASK: ${state.originalTask}
CURRENT URL: ${state.currentUrl || 'Not opened yet'}
PREVIOUS ACTIONS:
${pastSummary}

Available actions: open_page, extract_content, click_element, fill_form, submit_form, search_keywords
Return a JSON array of step strings, e.g. ["Open https://example.com", "Extract page content", "Click on register link"]
Return ONLY the JSON array, nothing else.`;

    const res = await llm.invoke(prompt);
    const content = typeof res.content === 'string' ? res.content : '';

    let steps: string[] = [];
    try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) steps = JSON.parse(match[0]);
    } catch {
        steps = [state.originalTask];
    }

    return { plan: steps, currentStep: 0, status: 'planned', iteration: state.iteration || 0 };
}

// --- Executor ---
async function executorNode(state: typeof AgentState.State) {
    const plan = state.plan || [];
    const idx = state.currentStep || 0;
    if (idx >= plan.length) {
        return { status: 'executing', pastSteps: [...(state.pastSteps || []), 'No more steps'] };
    }

    const step = plan[idx];
    console.log(`  EXEC [${idx + 1}/${plan.length}]: ${step}`);

    // Ask LLM to choose the right tool
    const prompt = `You have this browser step: "${step}"
Current URL: ${state.currentUrl || 'none'}

Pick exactly one action and respond ONLY with valid JSON:
- {"action":"open_page","url":"https://..."}
- {"action":"extract_content"}
- {"action":"click","selector":"css-selector"}
- {"action":"fill_form","fields":{"#sel":"val"}}
- {"action":"submit_form","selector":"form"}
- {"action":"search_keywords","keywords":["apply","register"]}
- {"action":"done","summary":"..."}`;

    const res = await llm.invoke(prompt);
    const content = typeof res.content === 'string' ? res.content : '';

    let result = '';
    let newUrl = state.currentUrl || '';
    let newTitle = state.pageTitle || '';
    let pageContent = state.pageContent || '';
    let pageElements = state.pageElements || {};

    try {
        const match = content.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) : { action: 'done', summary: content };

        switch (parsed.action) {
            case 'open_page': {
                const r = await browser.openPage(parsed.url);
                result = JSON.stringify(r);
                if (r.status === 'success') { newUrl = r.url!; newTitle = r.title!; }
                break;
            }
            case 'extract_content': {
                const r = await browser.extractPageContent();
                result = JSON.stringify(r).slice(0, 2000);
                if (!('error' in r)) {
                    pageContent = (r as any).readable_text || '';
                    pageElements = r;
                    newUrl = (r as any).url || newUrl;
                    newTitle = (r as any).title || newTitle;
                }
                break;
            }
            case 'click': {
                const r = await browser.clickElement(parsed.selector);
                result = JSON.stringify(r);
                if (r.status === 'clicked') { newUrl = r.new_url!; newTitle = r.new_title!; }
                break;
            }
            case 'fill_form': {
                const r = await browser.fillForm(parsed.fields);
                result = JSON.stringify(r);
                break;
            }
            case 'submit_form': {
                const r = await browser.submitForm(parsed.selector);
                result = JSON.stringify(r);
                if (r.status === 'submitted') { newUrl = r.new_url!; newTitle = r.new_title!; }
                break;
            }
            case 'search_keywords': {
                const r = await browser.searchForKeywords(parsed.keywords);
                result = JSON.stringify(r).slice(0, 2000);
                break;
            }
            default:
                result = parsed.summary || content;
        }
    } catch (e: any) {
        result = `Parse error: ${e.message}. LLM said: ${content.slice(0, 200)}`;
    }

    // Log to MongoDB
    await AgentLog.create({
        taskId: state.taskId,
        nodeName: 'executor',
        action: step,
        result: result.slice(0, 2000)
    });

    return {
        pastSteps: [...(state.pastSteps || []), `[${idx + 1}] ${step} → ${result.slice(0, 300)}`],
        currentUrl: newUrl,
        pageTitle: newTitle,
        pageContent: pageContent,
        pageElements: pageElements,
        status: 'executing'
    };
}

// --- Page Analyzer ---
async function pageAnalyzerNode(state: typeof AgentState.State) {
    const url = state.currentUrl || '';
    const elements = state.pageElements || {};

    const prompt = `Analyze this web page for the task: "${state.originalTask}"
URL: ${url}
Title: ${state.pageTitle || ''}
Headings: ${JSON.stringify((elements as any).headings || [])}
Links (sample): ${JSON.stringify(((elements as any).links || []).slice(0, 10))}
Buttons: ${JSON.stringify((elements as any).buttons || [])}
Forms: ${JSON.stringify((elements as any).forms || [])}

Is this page relevant? What key information is here? What should be done next?
Answer in 2-3 sentences.`;

    const res = await llm.invoke(prompt);
    const analysis = typeof res.content === 'string' ? res.content : '';

    await PageData.create({
        taskId: state.taskId,
        url,
        title: state.pageTitle || '',
        headings: (elements as any).headings || [],
        linksCount: ((elements as any).links || []).length,
        formsCount: ((elements as any).forms || []).length,
        analysis: analysis.slice(0, 1000),
    });

    return {
        pastSteps: [...(state.pastSteps || []), `Analyzed page: ${url} — ${analysis.slice(0, 200)}`],
        status: 'analyzed'
    };
}

// --- Evaluator ---
async function evaluatorNode(state: typeof AgentState.State) {
    const iteration = (state.iteration || 0) + 1;
    const nextStep = (state.currentStep || 0) + 1;
    const planLen = (state.plan || []).length;

    if (iteration >= MAX_ITERATIONS) {
        const summary = `Agent stopped after ${MAX_ITERATIONS} iterations (safety limit).`;
        await AgentTask.findByIdAndUpdate(state.taskId, { status: 'completed', result: summary });
        return { currentStep: nextStep, iteration, status: 'finished', finalResponse: summary };
    }

    if (nextStep >= planLen) {
        // Ask LLM if task is truly done
        const prompt = `Task: "${state.originalTask}"
Steps taken: ${(state.pastSteps || []).slice(-6).join('\n')}
Current URL: ${state.currentUrl}

Is the task fully done? Respond with JSON: {"done": true/false, "summary": "..."}`;

        const res = await llm.invoke(prompt);
        const content = typeof res.content === 'string' ? res.content : '';

        try {
            const match = content.match(/\{[\s\S]*\}/);
            const parsed = match ? JSON.parse(match[0]) : { done: true, summary: content };

            if (parsed.done) {
                await AgentTask.findByIdAndUpdate(state.taskId, { status: 'completed', result: parsed.summary });
                return { currentStep: nextStep, iteration, status: 'finished', finalResponse: parsed.summary };
            } else {
                return { currentStep: nextStep, iteration, status: 'needs_replan' };
            }
        } catch {
            await AgentTask.findByIdAndUpdate(state.taskId, { status: 'completed', result: content });
            return { currentStep: nextStep, iteration, status: 'finished', finalResponse: content };
        }
    }

    return { currentStep: nextStep, iteration, status: 'evaluated' };
}

function routerLogic(state: typeof AgentState.State): string {
    if (state.status === 'finished') return 'end';
    if (state.status === 'needs_replan') return 'replan';
    return 'execute';
}

// --- Compile Graph ---
const workflow = new StateGraph(AgentState)
    .addNode('planner', plannerNode)
    .addNode('executor', executorNode)
    .addNode('page_analyzer', pageAnalyzerNode)
    .addNode('evaluator', evaluatorNode)
    .addEdge('__start__', 'planner')
    .addEdge('planner', 'executor')
    .addEdge('executor', 'page_analyzer')
    .addEdge('page_analyzer', 'evaluator')
    .addConditionalEdges('evaluator', routerLogic, {
        execute: 'executor',
        replan: 'planner',
        end: '__end__',
    });

export const autonomousAgent = workflow.compile();
