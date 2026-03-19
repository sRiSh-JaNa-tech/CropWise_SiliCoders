from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import asyncio
import os
load_dotenv()
async def test():
    llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite-preview", google_api_key=os.getenv("GOOGLE_API_KEY"))
    res = await llm.ainvoke("say hello")
    print(repr(res.content))
    print(type(res.content))
asyncio.run(test())
