from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from chains.expert_chains import scheme_chain, market_chain, profile_chain
from tools.db_tools import search_schemes, get_user_profile
import os

# RE-EXPORTING THE GRAPH WITH AUDIO CONTEXT
class AgentState(TypedDict):
    query: str
    user_aadhaar: Optional[str]
    user_data: Optional[dict]
    scheme_data: Optional[List[dict]]
    response: str
    category: str 
    audio_output: Optional[str] # Base64 encoded audio

# ... (Previous nodes remain the same, just updating the type hint if needed)
# Since the logic is identical, we use the same app_graph, 
# but we handle the audio conversion in the server.py layer.
