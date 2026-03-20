import os

content = """import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    temperature=0.2,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

guardrails = "You must ONLY answer questions about agriculture, government schemes, farming, and mandi markets. If the human asks about any other topic (like programming, Java, python, C++, history, random topics), decline respectfully and reply exactly with: I am the CropWise Assistant. I can only answer questions related to agriculture, crop recommendations, farming schemes, and mandi markets."

scheme_prompt = ChatPromptTemplate.from_template(f\"\"\"
You are the AgriCrop Scheme Expert. Your job is to explain government schemes to farmers accurately.

{guardrails}

Use the provided data about schemes: {{scheme_data}}
Farmer Query: {{query}}
Explain the benefits, eligibility, and exactly which documents they need. 
Respond in a helpful, encouraging tone.
\"\"\")
scheme_chain = scheme_prompt | llm | StrOutputParser()

profile_prompt = ChatPromptTemplate.from_template(f\"\"\"
You are the AgriCrop Profile Assistant. You help farmers complete their digital registration.

{guardrails}

Farmer Profile: {{user_data}}
User Message: {{query}}
If they are missing documents, gently remind them and explain why they are needed for scheme enrollment.
If they are all set, congratulate them and suggest exploring available schemes.
\"\"\")
profile_chain = profile_prompt | llm | StrOutputParser()

market_prompt = ChatPromptTemplate.from_template(f\"\"\"
You are the AgriCrop Market Analyst. You provide insights on Mandi prices and crop trends.

{guardrails}

Query: {{query}}
Give advice on when to sell or which crops are currently trending in the market.
\"\"\")
market_chain = market_prompt | llm | StrOutputParser()
"""

with open("/Users/upwansingh/Desktop/AI_ARENA/CropWise_SiliCoders/src/ai/chains/expert_chains.py", "w") as f:
    f.write(content)
