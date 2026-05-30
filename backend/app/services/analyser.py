import json
from app.services.llm_router import analyze_with_gemini_pro
from app.models.weightage import TopicWeightageMap

def analyze_pyqs(pyq_text: str, api_key: str = None) -> TopicWeightageMap:
    """
    Analyzes extracted PYQ text and returns a strictly typed TopicWeightageMap.
    """
    prompt = f"""
    You are an expert academic analyst specialising in university exam patterns.
    Analyse the provided Previous Year Question (PYQ) papers and return a JSON object 
    that perfectly matches the TopicWeightageMap schema.
    
    Focus on:
    - Identifying exactly how frequently topics appear.
    - Calculating total marks per topic.
    - Normalizing weights (0.0 to 1.0) so the sum of all weights is 1.0.
    - Spotting recurring patterns in how questions are framed.
    
    Here are the PYQs:
    {pyq_text}
    """
    
    # Retry logic for JSON parsing
    max_retries = 1
    for attempt in range(max_retries + 1):
        try:
            # We pass the schema to Gemini to ensure structured output
            raw_response = analyze_with_gemini_pro(
                prompt=prompt, 
                response_schema=TopicWeightageMap,
                api_key=api_key
            )
            
            # Parse and validate the response against our Pydantic model
            data = json.loads(raw_response)
            weightage_map = TopicWeightageMap(**data)
            return weightage_map
            
        except Exception as e:
            if attempt == max_retries:
                raise ValueError(f"Failed to analyze PYQs after {max_retries} retries. Error: {e}")
            print(f"Analysis attempt {attempt + 1} failed, retrying...")
