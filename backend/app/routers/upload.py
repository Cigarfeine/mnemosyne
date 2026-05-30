import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB per file
ALLOWED_EXTENSIONS = {".pdf"}

@router.post("/upload")
async def upload_documents(
    subject: str = Form(...),
    pyqs: List[UploadFile] = File(...),
    notes: Optional[List[UploadFile]] = File(None),
    textbooks: Optional[List[UploadFile]] = File(None)
):
    if not pyqs:
        raise HTTPException(status_code=422, detail="At least one PYQ file is required.")
        
    # Validate pyqs has actual files
    valid_pyqs = [f for f in pyqs if f.filename]
    if not valid_pyqs:
        raise HTTPException(status_code=422, detail="At least one PYQ file is required.")

    session_id = str(uuid.uuid4())
    session_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(session_dir, exist_ok=True)
    
    file_count = 0
    pyq_count = 0
    
    # Helper to save files
    async def save_files(files, folder_name):
        nonlocal file_count, pyq_count
        if not files:
            return
        folder_path = os.path.join(session_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        for file in files:
            if not file.filename:
                continue
            # Security: sanitise filename to prevent path traversal
            safe_name = os.path.basename(file.filename)
            if not safe_name:
                continue
            # Validate file extension
            ext = os.path.splitext(safe_name)[1].lower()
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(status_code=422, detail=f"Only PDF files are accepted. Got: {safe_name}")
            content = await file.read()
            # Validate file size
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail=f"File {safe_name} exceeds 50MB limit.")
            file_path = os.path.join(folder_path, safe_name)
            with open(file_path, "wb") as f:
                f.write(content)
            file_count += 1
            if folder_name == "pyq":
                pyq_count += 1

    await save_files(pyqs, "pyq")
    await save_files(notes, "notes")
    await save_files(textbooks, "textbooks")
    
    # Save subject metadata
    with open(os.path.join(session_dir, "metadata.txt"), "w") as f:
        f.write(subject)
        
    return {
        "session_id": session_id,
        "file_count": file_count,
        "pyq_count": pyq_count
    }
