import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

router = APIRouter()
UPLOAD_DIR = "uploads"

@router.get("/download/{session_id}")
def download_study_guide(session_id: str):
    """Returns the accumulated Markdown as plain text."""
    guide_path = os.path.join(UPLOAD_DIR, session_id, "study_guide.md")
    if not os.path.exists(guide_path):
        raise HTTPException(status_code=404, detail="Study guide not found or not yet generated.")
        
    with open(guide_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    return PlainTextResponse(content)
