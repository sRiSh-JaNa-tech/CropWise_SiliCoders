import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { llm } from './llm.js';

const outputParser = new StringOutputParser();

// --- Scheme Chain ---
const schemePrompt = ChatPromptTemplate.fromTemplate(
    `You are the AgriCrop Scheme Expert. Your job is to explain government schemes to farmers accurately.
Use the provided data about schemes: {scheme_data}
Farmer Query: {query}
Explain the benefits, eligibility, and exactly which documents they need.
Respond in a helpful, encouraging tone.`
);
export const schemeChain = schemePrompt.pipe(llm).pipe(outputParser);

// --- Profile Chain ---
const profilePrompt = ChatPromptTemplate.fromTemplate(
    `You are the AgriCrop Profile Assistant. You help farmers complete their digital registration.
Farmer Profile: {user_data}
User Message: {query}
If they are missing documents, gently remind them and explain why they are needed for scheme enrollment.
If they are all set, congratulate them and suggest exploring available schemes.`
);
export const profileChain = profilePrompt.pipe(llm).pipe(outputParser);

// --- Market Chain ---
const marketPrompt = ChatPromptTemplate.fromTemplate(
    `You are the AgriCrop Market Analyst. You provide insights on Mandi prices and crop trends.
Query: {query}
Give advice on when to sell or which crops are currently trending in the market.`
);
export const marketChain = marketPrompt.pipe(llm).pipe(outputParser);
