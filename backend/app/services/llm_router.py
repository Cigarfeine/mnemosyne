import os
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types

def get_gemini_client(api_key: str = None) -> genai.Client:
    """
    Returns a Gemini client.
    If api_key is provided (BYOK), uses that.
    Otherwise, falls back to the server's GEMINI_API_KEY.
    """
    key_to_use = api_key or os.getenv("GEMINI_API_KEY")
    if not key_to_use:
        raise ValueError("No Gemini API key provided and no server default found.")
    
    return genai.Client(api_key=key_to_use)

def analyze_with_gemini_pro(prompt: str, response_schema=None, api_key: str = None) -> str:
    """Uses Gemini 2.5 Flash for deep reasoning tasks."""
    client = get_gemini_client(api_key)
    
    config_args = {}
    if response_schema:
        config_args["response_mime_type"] = "application/json"
        
        # In Gemini Developer API mode, strict schema constraints (like additionalProperties) 
        # are often rejected. Instead of passing response_schema to the API config, 
        # we append the schema to the prompt to enforce structure via instruction.
        schema_json = response_schema.model_json_schema() if hasattr(response_schema, "model_json_schema") else str(response_schema)
        prompt += f"\n\nYou MUST return ONLY valid JSON matching this exact schema:\n{schema_json}"
        
    config = types.GenerateContentConfig(**config_args)
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=config,
        )
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise e

def process_with_gemini_flash(prompt: str, images: list = None, api_key: str = None) -> str:
    """Uses Gemini 2.5 Flash for fast OCR and basic text processing."""
    client = get_gemini_client(api_key)
    
    contents = []
    if images:
        for img in images:
            contents.append(img)
    contents.append(prompt)
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
        )
        return response.text
    except Exception as e:
        print(f"Gemini Flash API error: {e}")
        raise e
