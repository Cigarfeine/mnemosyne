import os
from dotenv import load_dotenv
load_dotenv()
from google import genai

key = os.getenv("GEMINI_API_KEY")
if not key:
    print("NO API KEY")
    exit(1)

client = genai.Client(api_key=key)
for m in client.models.list():
    print(f"Model Name: {m.name}, Display: {m.display_name}")
    if "generateContent" in m.supported_generation_methods:
        print("  -> Supports generateContent")
