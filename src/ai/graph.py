from typing import TypedDict, Annotated, List, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from chains.expert_chains import scheme_chain, market_chain, profile_chain
from tools.db_tools import search_schemes, get_user_profile
import os

# 1. Define the State
class AgentState(TypedDict):
    query: str
    user_aadhaar: Optional[str]
    user_data: Optional[dict]
    scheme_data: Optional[List[dict]]
    response: str
    category: str # 'scheme', 'market', 'profile', 'general'

# 2. Router Node: Identifies User Intent
llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", google_api_key=os.getenv("GOOGLE_API_KEY"))

async def router_node(state: AgentState):
    prompt = f"""
    Analyze this message from a farmer and categorize it into ONE of these:
    - 'scheme': Questions about govt schemes (PM-Kisan, etc).
    - 'market': Questions about Mandi prices or selling crops.
    - 'profile': Questions about their registration, documents, or Aadhaar.
    - 'general': Anything else.
    
    Message: {state['query']}
    Category:"""
    
    res = await llm.ainvoke(prompt)
    category_content = res.content
    if isinstance(category_content, list):
        category = "".join([p.get("text", "") for p in category_content if isinstance(p, dict) and p.get("type") == "text"]).strip().lower()
    else:
        category = category_content.strip().lower()
    return {"category": category}

# 3. Knowledge Fetching Node
async def fetch_data_node(state: AgentState):
    category = state["category"]
    user_data = None
    scheme_data = None
    
    if category == 'profile' and state["user_aadhaar"]:
        user_data = await get_user_profile(state["user_aadhaar"])
    elif category == 'scheme':
        scheme_data = await search_schemes(state["query"])
        
    return {"user_data": user_data, "scheme_data": scheme_data}

# 4. Expert Nodes
async def scheme_expert(state: AgentState):
    res = await scheme_chain.ainvoke({"query": state["query"], "scheme_data": state["scheme_data"]})
    return {"response": res}

async def market_expert(state: AgentState):
    res = await market_chain.ainvoke({"query": state["query"]})
    return {"response": res}

async def profile_expert(state: AgentState):
    res = await profile_chain.ainvoke({"query": state["query"], "user_data": state["user_data"]})
    return {"response": res}

async def general_expert(state: AgentState):
    prompt = f"""
    You are the agricultural assistant for CropWise.
    You MUST ONLY answer questions related to agriculture, farming, crops, soil, farmer schemes, or Mandy markets.
    If the user asks about anything else (e.g., coding, general knowledge, sports, history, etc.), kindly decline by saying exactly:
    "I am the CropWise Assistant. I can only answer questions related to agriculture, crop recommendations, farming schemes, and mandi markets."
    
    User Query: {state['query']}
    """
    res = await llm.ainvoke(prompt)
    resp_content = res.content
    if isinstance(resp_content, list):
        resp_content = "".join([p.get("text", "") for p in resp_content if isinstance(p, dict) and p.get("type") == "text"])
    return {"response": resp_content}
# 5. Conditional Routing Logic
def route_direction(state: AgentState):
    category = state["category"]
    if category == 'scheme': return 'scheme_expert'
    if category == 'market': return 'market_expert'
    if category == 'profile': return 'profile_expert'
    return 'general_expert'

# 6. Build Graph
workflow = StateGraph(AgentState)

workflow.add_node("router", router_node)
workflow.add_node("fetcher", fetch_data_node)
workflow.add_node("scheme_expert", scheme_expert)
workflow.add_node("market_expert", market_expert)
workflow.add_node("profile_expert", profile_expert)
workflow.add_node("general_expert", general_expert)

workflow.set_entry_point("router")
workflow.add_edge("router", "fetcher")
workflow.add_conditional_edges("fetcher", route_direction)
workflow.add_edge("scheme_expert", END)
workflow.add_edge("market_expert", END)
workflow.add_edge("profile_expert", END)
workflow.add_edge("general_expert", END)

app_graph = workflow.compile()
