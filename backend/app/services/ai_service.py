import anthropic
import json
import os
from dotenv import load_dotenv

load_dotenv("../.env")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "sk-ant-placeholder"))


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


TUTOR_SYSTEM_PROMPT = """You are Mnemosyne, an intelligent AI tutor with deep awareness of how humans learn and forget.

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

You are not a search engine. You are a cognitive partner that understands their unique learning patterns.

Student's weak concepts: {weak_concepts}
Document context: {context}"""


def extract_concepts_from_chunk(text: str) -> list:
    prompt = CONCEPT_EXTRACTION_PROMPT.replace("{text}", text[:4000])

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()

    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
        response_text = response_text.strip()

    data = json.loads(response_text)
    return data.get("concepts", [])


def generate_questions_for_concept(concept_name: str, definition: str, difficulty: int, num_questions: int = 3) -> list:
    prompt = QUESTION_GENERATION_PROMPT.replace("{concept_name}", concept_name)
    prompt = prompt.replace("{definition}", definition)
    prompt = prompt.replace("{difficulty}", str(difficulty))
    prompt = prompt.replace("{num_questions}", str(num_questions))

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text.strip()

    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
        response_text = response_text.strip()

    return json.loads(response_text)


def chat_with_tutor(message: str, context: str, weak_concepts: list, history: list) -> str:
    system = TUTOR_SYSTEM_PROMPT.replace(
        "{weak_concepts}", ", ".join(weak_concepts) if weak_concepts else "None identified yet"
    ).replace("{context}", context[:3000] if context else "No specific document context provided")

    messages = history[-10:] + [{"role": "user", "content": message}]

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=messages
    )

    return response.content[0].text
