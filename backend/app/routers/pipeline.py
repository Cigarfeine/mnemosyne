import os
import json
import re
import asyncio
import shutil
from fastapi import APIRouter, Header, Request, HTTPException
from fastapi.responses import StreamingResponse

from app.services.extractor import extract_text_from_pdf
from app.services.analyser import analyze_pyqs
from app.services.mapper import map_notes_to_topics
from app.services.generator import generate_topic_section_stream

router = APIRouter()

UPLOAD_DIR = "uploads"
UUID_PATTERN = re.compile(r'^[a-f0-9\-]{36}$')

# Global state for simple status polling
session_status = {}

def get_session_status(session_id: str):
    return session_status.get(session_id, {
        "session_id": session_id,
        "status": "pending",
        "current_step": "waiting",
        "step_index": 0,
        "total_steps": 5,
        "error": None
    })

def set_session_status(session_id, current_step, step_index, status="processing", error=None):
    session_status[session_id] = {
        "session_id": session_id,
        "status": status,
        "current_step": current_step,
        "step_index": step_index,
        "total_steps": 5,
        "error": error
    }

def sse_message(event_type: str, **kwargs) -> str:
    payload = {"type": event_type, **kwargs}
    return f"data: {json.dumps(payload)}\n\n"

async def study_pipeline_generator(session_id: str, api_key: str):
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    if not os.path.exists(session_dir):
        yield sse_message("error", message="Session not found")
        return
        
    try:
        # Step 1: Extracting
        set_session_status(session_id, "extracting", 1)
        yield sse_message("step", step="extracting", index=1, total=5)
        
        pyq_text = ""
        notes_text = ""
        
        pyq_dir = os.path.join(session_dir, "pyq")
        if os.path.exists(pyq_dir):
            for file in os.listdir(pyq_dir):
                pyq_text += extract_text_from_pdf(os.path.join(pyq_dir, file), "pyq", api_key) + "\n\n"
                
        notes_dir = os.path.join(session_dir, "notes")
        if os.path.exists(notes_dir):
            for file in os.listdir(notes_dir):
                notes_text += extract_text_from_pdf(os.path.join(notes_dir, file), "notes", api_key) + "\n\n"
                
        textbooks_dir = os.path.join(session_dir, "textbooks")
        if os.path.exists(textbooks_dir):
            for file in os.listdir(textbooks_dir):
                notes_text += extract_text_from_pdf(os.path.join(textbooks_dir, file), "textbook", api_key) + "\n\n"
                
        # If no PYQ text extracted, fail early instead of using mock data
        if not pyq_text.strip():
            yield sse_message("error", message="Could not extract any text from the uploaded PYQ files. Please ensure they are valid PDFs.")
            return

        # Step 2: Analysing
        set_session_status(session_id, "analysing", 2)
        yield sse_message("step", step="analysing", index=2, total=5)
        
        weightage_map = analyze_pyqs(pyq_text, api_key)
        yield sse_message("weightage", payload=weightage_map.model_dump())
        
        # Step 3: Mapping
        set_session_status(session_id, "mapping", 3)
        yield sse_message("step", step="mapping", index=3, total=5)
        
        mapped_chunks, updated_weightage_map = map_notes_to_topics(weightage_map, notes_text)
        
        # Step 4: Generating
        set_session_status(session_id, "generating", 4)
        yield sse_message("step", step="generating", index=4, total=5)
        
        final_markdown = ""
        
        # Stream markdown for each topic in descending order of weight
        sorted_topics = sorted(updated_weightage_map.topics, key=lambda t: t.weight, reverse=True)
        for topic in sorted_topics:
            relevant_notes = mapped_chunks.get(topic.id, [])
            for chunk in generate_topic_section_stream(topic, relevant_notes, updated_weightage_map, api_key):
                final_markdown += chunk
                yield sse_message("chunk", payload=chunk)
                await asyncio.sleep(0.01) # Yield control to event loop
            final_markdown += "\n\n"
            yield sse_message("chunk", payload="\n\n")
            
        # Append predicted questions as appendix
        if updated_weightage_map.predicted_questions:
            appendix = "## Predicted Questions Appendix\n\n"
            for q in updated_weightage_map.predicted_questions:
                appendix += f"- **{q.question}** ({q.marks} marks, {int(q.probability*100)}% probability)\n"
            final_markdown += appendix
            yield sse_message("chunk", payload=appendix)
            
        # Save accumulated markdown for download
        with open(os.path.join(session_dir, "study_guide.md"), "w", encoding="utf-8") as f:
            f.write(final_markdown)
            
        # Step 5: Complete
        set_session_status(session_id, "complete", 5, status="complete")
        yield sse_message("step", step="complete", index=5, total=5)
        yield sse_message("done")
        
    except Exception as e:
        print(f"Pipeline error for session {session_id}: {e}")
        error_msg = str(e)
        # Sanitise: pass through quota/rate limit messages, genericise everything else
        if "429" in error_msg or "quota" in error_msg.lower() or "RESOURCE_EXHAUSTED" in error_msg:
            safe_msg = error_msg
        else:
            safe_msg = "An internal error occurred during generation. Please try again."
        set_session_status(session_id, "error", 0, status="error", error=safe_msg)
        yield sse_message("error", message=safe_msg)
    finally:
        # Clean up session_status to prevent memory leak
        session_status.pop(session_id, None)
        # Clean up uploaded source files (keep study_guide.md)
        session_dir = os.path.join(UPLOAD_DIR, session_id)
        for subfolder in ["pyq", "notes", "textbooks"]:
            path = os.path.join(session_dir, subfolder)
            if os.path.exists(path):
                shutil.rmtree(path, ignore_errors=True)

@router.get("/generate/stream/{session_id}")
async def generate_stream(session_id: str, request: Request, x_api_key: str = Header(default=None)):
    """SSE endpoint for pipeline generation."""
    if not UUID_PATTERN.match(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID format.")
    return StreamingResponse(
        study_pipeline_generator(session_id, x_api_key),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
