import os
import json
from google.genai import types
from app.services.llm_router import get_gemini_client
from app.models.weightage import Topic, TopicWeightageMap

def generate_topic_section_stream(topic: Topic, relevant_notes: list, weightage_map: TopicWeightageMap, api_key: str = None):
    """
    Yields Markdown text chunks for a single topic section.
    """
    client = get_gemini_client(api_key)
    
    notes_context = "\n".join(relevant_notes) if relevant_notes else "No relevant notes provided for this topic."
    
    prompt = f"""
    Generate a comprehensive, exam-optimised study guide section for: {topic.name}

    Context:
    - This topic has appeared {topic.frequency} times across {weightage_map.total_papers_analysed} papers.
    - It carries approximately {topic.total_marks} marks total.
    - Question types: {json.dumps(topic.question_types)}
    - Recurring patterns: {json.dumps(topic.recurring_patterns)}
    - Content from the student's notes:
    {notes_context}

    Produce the following in Markdown format:
    1. ## {topic.name}  [Weight: {int(topic.weight * 100)}%]
    2. A 2-line definition
    3. ### Core Concepts (bullet points, exam-density)
    4. ### Syntax / Rules (code blocks for programs, if applicable)
    5. ### Worked Example (with output, if applicable)
    6. ### Exam Patterns (what specifically keeps appearing)
    7. ### Common Mistakes
    8. ### Quick Revision (3 bullets max)

    Rules:
    - For any mathematical formulas, equations, or variables, YOU MUST use LaTeX notation. Use single `$` for inline math and double `$$` for block math.
    - If the topic benefits from a diagram, produce a valid Mermaid.js block (```mermaid ... ```).
    - Do not fabricate content not present in the student's notes unless it is universally known academic fact necessary for context.
    - If the notes have a gap (gap_topics is not empty), flag it with a callout: 
      > [!WARNING] 
      > **Gap Detected** — This subtopic appeared in exams but is thin in your notes.
    """

    response = client.models.generate_content_stream(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    for chunk in response:
        if chunk.text:
            yield chunk.text
