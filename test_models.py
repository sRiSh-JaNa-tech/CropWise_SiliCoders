import os, requests
from dotenv import load_dotenv
load_dotenv('/Users/upwansingh/Desktop/AI_ARENA/CropWise_SiliCoders/.env')
api = os.getenv('GEMINI_API_KEY')
models = [
      "gemini-2.5-flash",
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",
]
for m in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api}"
    try:
        r = requests.post(url, json={"contents":[{"parts":[{"text":"hello"}]}]})
        print(f"{m} -> {r.status_code}")
        if r.status_code != 200:
            print(r.text)
    except Exception as e:
        print(f"{m} -> Exception: {e}")
