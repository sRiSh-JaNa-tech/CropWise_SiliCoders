import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", # Using 1.5-flash for stable production logic
    temperature=0.2,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# --- 1. SCHEME CHAIN (Expert in PM Schemes) ---
scheme_prompt = ChatPromptTemplate.from_template("""
You are the AgriCrop Scheme Expert. Your job is to explain government schemes to farmers accurately.
Use the provided data about schemes: {scheme_data}
Farmer Query: {query}
Explain the benefits, eligibility, and exactly which documents they need. 
Respond in a helpful, encouraging tone.
""")

scheme_chain = scheme_prompt | llm | StrOutputParser()


# --- 2. PROFILE CHAIN (Expert in KYC & Documents) ---
profile_prompt = ChatPromptTemplate.from_template("""
You are the AgriCrop Profile Assistant. You help farmers complete their digital registration.
Farmer Profile: {user_data}
User Message: {query}
If they are missing documents, gently remind them and explain why they are needed for scheme enrollment.
If they are all set, congratulate them and suggest exploring available schemes.
""")

profile_chain = profile_prompt | llm | StrOutputParser()


# --- 3. MARKET CHAIN (Expert in Prices) ---
market_prompt = ChatPromptTemplate.from_template("""
You are the AgriCrop Market Analyst. You provide insights on Mandi prices and crop trends.
Query: {query}
Give advice on when to sell or which crops are currently trending in the market. (Note: Use general market wisdom as we simulate live data).
""")

market_chain = market_prompt | llm | StrOutputParser()
