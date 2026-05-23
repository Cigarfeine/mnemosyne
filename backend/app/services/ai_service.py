import json
import os
import time
import traceback
from dotenv import load_dotenv

load_dotenv(".env")

from groq import Groq
GROQ_MODELS = [
    "deepseek-r1-distill-llama-70b-specdec",
    "deepseek-r1-distill-qwen-32b",
    "llama-3.3-70b-versatile", 
    "llama-3.1-8b-instant"
]



CONCEPT_EXTRACTION_PROMPT = """You are an expert educator and knowledge architect. Analyze the following study material and extract the key concepts.

For each concept, identify:
1. Its name (concise, 1-5 words)
2. A clear definition (2-3 sentences max)
3. Its category (e.g. Algorithm, Data Structure, Theorem, Formula, Process, Definition)
4. Difficulty level (1=very easy, 5=very hard)
5. Prerequisites (other concepts from this text that must be understood first)
6. Related concepts (concepts that connect to this one)

Return ONLY a valid JSON object with this exact structure:
{{
  "concepts": [
    {{
      "name": "Binary Search Tree",
      "definition": "A tree data structure where each node has at most two children. The left subtree contains nodes with keys less than the parent, and the right subtree contains nodes with keys greater than the parent.",
      "category": "Data Structure",
      "difficulty": 3,
      "prerequisites": ["Tree", "Node", "Pointer"],
      "related_concepts": ["AVL Tree", "Heap", "Binary Search"]
    }}
  ]
}}

Study material:
{text}

Return ONLY the JSON. No explanation, no markdown code blocks, no preamble."""


QUESTION_GENERATION_PROMPT = """You are an expert educator specializing in active recall and spaced repetition.

Generate {num_questions} questions for the following concept to test deep understanding.

Concept: {concept_name}
Definition: {definition}
Difficulty: {difficulty}/5

Generate a mix of:
- MCQ (multiple choice with 4 options)
- open_recall (open-ended short answer)
- fill_blank (fill in the blank)

CRITICAL: Always format ALL mathematical expressions, equations, numbers, and variables using LaTeX syntax wrapped in $ for inline math (e.g., $2^7 = 128$) and $$ for block math. Never use raw plain text like 2^7 for math.

Return ONLY a valid JSON array:
[
  {{
    "question": "What property distinguishes a BST from a regular binary tree?",
    "question_type": "open_recall",
    "options": null,
    "correct_answer": "In a BST, left children are always smaller than the parent, and right children are always larger.",
    "explanation": "This ordering property is what makes BSTs efficient for search operations.",
    "difficulty": 3
  }}
]

Return ONLY the JSON array."""


PYQ_QUESTION_PROMPT = """You are an expert exam coach who analyzes Previous Year Question (PYQ) patterns.

Generate {num_questions} exam-style questions for the following concept, mimicking patterns commonly seen in university and competitive exams.

Concept: {concept_name}
Definition: {definition}
Difficulty: {difficulty}/5

Focus on:
- Common exam traps and tricky variations
- Numerical problems and calculation-based questions where applicable
- Questions that test application, not just recall
- Multi-step problems that combine multiple concepts
- Common mistakes students make in exams

Generate a mix of:
- MCQ (multiple choice with 4 options, including common wrong answers students pick)
- open_recall (short answer requiring precise technical language)
- fill_blank (fill in the blank with key terms or values)

CRITICAL: Always format ALL mathematical expressions, equations, numbers, and variables using LaTeX syntax wrapped in $ for inline math (e.g., $2^7 = 128$) and $$ for block math. Never use raw plain text like 2^7 for math.

Return ONLY a valid JSON array:
[
  {{
    "question": "In an exam, a student is asked...",
    "question_type": "mcq",
    "options": ["correct answer", "common wrong answer 1", "common wrong answer 2", "tricky distractor"],
    "correct_answer": "correct answer",
    "explanation": "Students often pick option B because... but the correct answer is A because...",
    "difficulty": 3
  }}
]

Return ONLY the JSON array."""


NOTES_TUTOR_PROMPT = """You are Mnemosyne, an intelligent AI tutor with deep awareness of how humans learn and forget.

You have access to the student's learning data:
- Current weak concepts (low retention score)
- Recently reviewed topics
- Document context chunks

Your tutoring style:
- Be concise but thorough
- Use analogies and real-world examples
- Connect new concepts to what the student already knows well
- Gently probe understanding with questions
- When a student seems confused, step back and build from prerequisites
- Reference specific parts of their uploaded material when relevant
- CRITICAL: Always format ALL mathematical expressions, equations, numbers, and variables using LaTeX syntax wrapped in $ for inline math (e.g., $2^7 = 128$) and $$ for block math. Never use raw plain text like 2^7 for math.

Student's weak concepts: {weak_concepts}
Document context: {context}"""


PYQ_TUTOR_PROMPT = """You are Mnemosyne, an expert exam preparation coach who specializes in Previous Year Question (PYQ) pattern analysis.

Your coaching style:
- Analyze question patterns from previous exams
- Identify frequently tested topics and common question formats
- Teach exam-specific strategies: elimination techniques, time management, mark allocation
- Highlight common mistakes and traps in exam questions
- Provide solving shortcuts and tricks where applicable
- When explaining, frame everything in the context of "how this appears in exams"
- Give model answers that would score full marks
- CRITICAL: Always format ALL mathematical expressions, equations, numbers, and variables using LaTeX syntax wrapped in $ for inline math (e.g., $2^7 = 128$) and $$ for block math. Never use raw plain text like 2^7 for math.

Student's weak concepts: {weak_concepts}
Document context: {context}"""



def _call_groq(api_key: str, prompt: str, system_prompt: str = None, history: list = None, max_tokens: int = 4096) -> str:
    """Call Groq API with retry and model fallback."""
    if not api_key:
        raise Exception("API key is missing.")
    
    groq_client = Groq(api_key=api_key)
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    if history:
        messages.extend(history[-10:])
    messages.append({"role": "user", "content": prompt})

    last_error = None
    for model in GROQ_MODELS:
        for attempt in range(3):
            try:
                response = groq_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                last_error = e
                error_str = str(e)
                if "rate_limit" in error_str.lower() or "429" in error_str:
                    wait = min(2 ** attempt * 3, 15)
                    print(f"Groq rate limit on {model} (attempt {attempt+1}/3), waiting {wait}s...")
                    time.sleep(wait)
                    continue
                elif "503" in error_str or "unavailable" in error_str.lower():
                    wait = min(2 ** attempt * 2, 10)
                    print(f"Groq {model} unavailable, waiting {wait}s...")
                    time.sleep(wait)
                    continue
                else:
                    print(f"Groq error with {model}: {e}")
                    break
    raise Exception(f"All Groq models failed. Last error: {last_error}")


def _call_ai(api_key: str, prompt: str, system_prompt: str = None, history: list = None, max_tokens: int = 4096) -> str:
    if not api_key:
        raise Exception("401 Unauthorized: Groq API Key is missing. Please provide a valid key.")
    return _call_groq(api_key, prompt, system_prompt, history, max_tokens)


def _parse_json(text: str):
    """Parse JSON from model response, stripping markdown fences if present."""
    import re
    cleaned = re.sub(r'<think>.*?(?:</think>|$)', '', text, flags=re.DOTALL).strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        start = 0
        end = len(lines)
        for i, line in enumerate(lines):
            if line.strip().startswith("```"):
                if i == 0:
                    start = i + 1
                else:
                    end = i
                    break
        cleaned = "\n".join(lines[start:end]).strip()
    return json.loads(cleaned)


def get_ai_health(api_key: str = None) -> dict:
    result = {
        "provider": "groq",
        "status": "unknown",
        "model": GROQ_MODELS[0],
        "message": "",
    }
    
    if not api_key:
        result["status"] = "invalid_key"
        result["message"] = "API key is missing."
        return result

    try:
        response = _call_ai(api_key, "Reply with exactly: OK", max_tokens=10)
        result["status"] = "healthy"
        result["message"] = "AI service is operational"
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "rate_limit" in error_str.lower():
            result["status"] = "rate_limited"
            result["message"] = "API quota temporarily exhausted. Will retry automatically."
        elif "401" in error_str or "invalid" in error_str.lower() or "api_key" in error_str.lower():
            result["status"] = "invalid_key"
            result["message"] = "API key is invalid or missing. Check your .env file."
        else:
            result["status"] = "error"
            result["message"] = str(e)[:200]
    return result



def extract_concepts_from_chunk(api_key: str, text: str) -> list:
    try:
        prompt = CONCEPT_EXTRACTION_PROMPT.replace("{text}", text[:4000])
        response_text = _call_ai(api_key, prompt, max_tokens=4096)
        data = _parse_json(response_text)
        return data.get("concepts", [])
    except Exception as e:
        print(f"AI SERVICE ERROR (concept extraction): {e}\n{traceback.format_exc()}")
        return []


def generate_questions_for_concept(api_key: str, concept_name: str, definition: str, difficulty: int, num_questions: int = 3, study_mode: str = "notes") -> list:
    try:
        if study_mode == "pyq":
            prompt = PYQ_QUESTION_PROMPT.replace("{concept_name}", concept_name)
        else:
            prompt = QUESTION_GENERATION_PROMPT.replace("{concept_name}", concept_name)

        prompt = prompt.replace("{definition}", definition)
        prompt = prompt.replace("{difficulty}", str(difficulty))
        prompt = prompt.replace("{num_questions}", str(num_questions))

        response_text = _call_ai(api_key, prompt, max_tokens=2048)
        return _parse_json(response_text)
    except Exception as e:
        print(f"AI SERVICE ERROR (question generation): {e}\n{traceback.format_exc()}")
        return [
            {
                "question": f"What is the main idea behind {concept_name}?",
                "question_type": "open_recall",
                "options": None,
                "correct_answer": definition,
                "explanation": "This is fundamental to understanding the concept.",
                "difficulty": difficulty
            },
        ]


def chat_with_tutor(api_key: str, message: str, context: str, weak_concepts: list, history: list, study_mode: str = "notes") -> str:
    try:
        if study_mode == "pyq":
            system = PYQ_TUTOR_PROMPT
        else:
            system = NOTES_TUTOR_PROMPT

        system = system.replace(
            "{weak_concepts}", ", ".join(weak_concepts) if weak_concepts else "None identified yet"
        ).replace("{context}", context[:3000] if context else "No specific document context provided")

        response_text = _call_ai(api_key, message, system_prompt=system, history=history, max_tokens=4096)
        import re
        response_text = re.sub(r'<think>.*?(?:</think>|$)', '', response_text, flags=re.DOTALL).strip()
        return response_text
    except Exception as e:
        print(f"AI SERVICE ERROR (tutor chat): {e}\n{traceback.format_exc()}")
        return "⚠️ AI is temporarily unavailable. Please try again in a minute. Error: " + str(e)[:100]

def chat_with_tutor_stream(api_key: str, message: str, context: str, weak_concepts: list, history: list, study_mode: str = "notes"):
    try:
        if study_mode == "pyq":
            system = PYQ_TUTOR_PROMPT
        else:
            system = NOTES_TUTOR_PROMPT

        system = system.replace(
            "{weak_concepts}", ", ".join(weak_concepts) if weak_concepts else "None identified yet"
        ).replace("{context}", context[:3000] if context else "No specific document context provided")

        messages = []
        messages.append({"role": "system", "content": system})
        messages.extend(history[-10:])
        messages.append({"role": "user", "content": message})

        client = Groq(api_key=api_key)
        
        last_error = None
        for model in GROQ_MODELS:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=4096,
                    temperature=0.7,
                    stream=True
                )
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
                return  # If successful, exit the generator
            except Exception as e:
                print(f"Model {model} failed in stream: {e}")
                last_error = e
                continue
                
        raise last_error
    except Exception as e:
        print(f"AI SERVICE ERROR (tutor stream): {e}\n{traceback.format_exc()}")
        yield f"⚠️ Error: {str(e)[:100]}"
