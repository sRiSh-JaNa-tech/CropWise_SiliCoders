from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import os
import base64
import io
import google.generativeai as genai
from graph import app_graph
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Initialize Google Generative AI
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI(title="AgriCrop AI Free Voice Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(query: str = Form(...), aadhaar: Optional[str] = Form(None)):
    try:
        inputs = {
            "query": query, 
            "user_aadhaar": aadhaar,
            "response": "",
            "category": ""
        }
        final_state = await app_graph.ainvoke(inputs)
        return {"response": final_state["response"], "category": final_state["category"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/audio-chat")
async def audio_chat(audio: UploadFile = File(...), aadhaar: Optional[str] = Form(None)):
    try:
        # 1. Transcribe Audio (Gemini 1.5 Flash - FREE)
        audio_bytes = await audio.read()
        
        # Gemini expects a part list for multimodal
        response = gemini_model.generate_content([
            "Transcribe this audio message from a farmer exactly as spoken, but keep it concise if there's noise. Output ONLY the transcription text.",
            {
                "mime_type": "audio/wav",
                "data": audio_bytes
            }
        ])
        
        user_text = response.text.strip()
        print(f"Transcribed Text: {user_text}")
        
        # 2. Process with LangGraph
        inputs = {
            "query": user_text,
            "user_aadhaar": aadhaar,
            "response": "",
            "category": ""
        }
        final_state = await app_graph.ainvoke(inputs)
        ai_response_text = final_state["response"]
        
        # 3. Voice Synthesis (Handled by Frontend via Web Speech API for FREE)
        # We no longer need to generate audio on the backend.
        
        return {
            "user_text": user_text,
            "response": ai_response_text,
            "category": final_state["category"]
        }
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9000)
