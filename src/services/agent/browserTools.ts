/**
 * Autonomous Agent — Browser Tools
 * Persistent Playwright session for multi-page navigation.
 */
import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;
let page: Page | null = null;

async function ensureBrowser(): Promise<Page> {
    if (!browser || !browser.isConnected()) {
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
    }
    return page!;
}

export async function openPage(url: string) {
    const p = await ensureBrowser();
    try {
        await p.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
        return { status: 'success', url: p.url(), title: await p.title() };
    } catch (e: any) {
        return { status: 'error', error: e.message };
    }
}

export async function extractPageContent() {
    const p = await ensureBrowser();
    try {
        const headings = await p.$$eval('h1,h2,h3,h4', els =>
            els.map(e => ({ tag: e.tagName, text: (e as HTMLElement).innerText.trim() }))
        );
        const links = await p.$$eval('a[href]', els =>
            els.slice(0, 30).map(e => ({ text: (e as HTMLAnchorElement).innerText.trim(), href: (e as HTMLAnchorElement).href }))
        );
        const buttons = await p.$$eval('button, input[type="submit"], [role="button"]', els =>
            els.map(e => ({ text: (e as HTMLElement).innerText?.trim() || (e as HTMLInputElement).value || '', tag: e.tagName, id: e.id }))
        );
        const forms = await p.$$eval('form', els =>
            els.map(f => ({
                id: f.id,
                action: (f as HTMLFormElement).action,
                fields: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({
                    name: (i as HTMLInputElement).name,
                    type: (i as HTMLInputElement).type,
                    placeholder: (i as HTMLInputElement).placeholder,
                }))
            }))
        );
        const bodyText = await p.$eval('body', el => (el as HTMLElement).innerText);

        return {
            url: p.url(),
            title: await p.title(),
            headings,
            links,
            buttons,
            forms,
            readable_text: (bodyText || '').slice(0, 3000),
        };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function clickElement(selector: string) {
    const p = await ensureBrowser();
    try {
        await p.click(selector, { timeout: 8000 });
        await p.waitForLoadState('domcontentloaded', { timeout: 10000 });
        return { status: 'clicked', new_url: p.url(), new_title: await p.title() };
    } catch (e: any) {
        return { status: 'error', error: e.message };
    }
}

export async function fillForm(fields: Record<string, string>) {
    const p = await ensureBrowser();
    try {
        for (const [selector, value] of Object.entries(fields)) {
            await p.fill(selector, value, { timeout: 5000 });
        }
        return { status: 'filled', fields_count: Object.keys(fields).length };
    } catch (e: any) {
        return { status: 'error', error: e.message };
    }
}

export async function submitForm(selector: string = 'form') {
    const p = await ensureBrowser();
    try {
        const submitBtn = await p.$(`${selector} button[type="submit"], ${selector} input[type="submit"]`);
        if (submitBtn) {
            await submitBtn.click();
        } else {
            await p.$eval(selector, (f: any) => f.submit());
        }
        await p.waitForLoadState('domcontentloaded', { timeout: 15000 });
        return { status: 'submitted', new_url: p.url(), new_title: await p.title() };
    } catch (e: any) {
        return { status: 'error', error: e.message };
    }
}

export async function searchForKeywords(keywords: string[]) {
    const p = await ensureBrowser();
    try {
        const allLinks = await p.$$eval('a[href]', els =>
            els.map(e => ({ text: (e as HTMLAnchorElement).innerText.trim(), href: (e as HTMLAnchorElement).href }))
        );
        const allButtons = await p.$$eval('button, input[type="submit"], [role="button"]', els =>
            els.map(e => ({ text: (e as HTMLElement).innerText?.trim() || (e as HTMLInputElement).value || '', tag: e.tagName }))
        );
        const kw = keywords.map(k => k.toLowerCase());
        const matchingLinks = allLinks.filter(l =>
            kw.some(k => (l.text + ' ' + l.href).toLowerCase().includes(k))
        ).slice(0, 15);
        const matchingButtons = allButtons.filter(b =>
            kw.some(k => b.text.toLowerCase().includes(k))
        ).slice(0, 10);

        return { keywords, matchingLinks, matchingButtons };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
        page = null;
    }
}
