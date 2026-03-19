import { chatGraph } from './src/services/ai/chatGraph.js';
import dotenv from 'dotenv';
dotenv.config();

async function testGraph() {
    console.log("Testing Planner Expert...");
    const res1 = await chatGraph.invoke({
        query: "What should I do for my wheat crop next week?",
        planner_input: { cropType: 'Wheat', location: 'Ghaziabad', sowingDate: '2024-03-20' },
        connectivity: 'high',
        dialect: 'English'
    });
    console.log("Response:", res1.response.slice(0, 100), "...");

    console.log("\nTesting Mandi Expert...");
    const res2 = await chatGraph.invoke({
        query: "What are the latest rice prices?",
        connectivity: 'high',
        dialect: 'English'
    });
    console.log("Response:", res2.response.slice(0, 100), "...");
    
    process.exit(0);
}

testGraph().catch(e => { console.error(e); process.exit(1); });
