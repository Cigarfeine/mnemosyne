from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.database import get_db, Document, DocumentChunk
from app.api.auth import get_user_id
from app.services.pdf_service import extract_text_from_pdf, chunk_text, clean_text
import shutil
import os
import uuid
from datetime import datetime

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    subject: str = "General",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Create document record first to get its ID
    doc = Document(
        title=file.filename.replace(".pdf", ""),
        filename=file.filename,
        subject=subject,
        status="processing",
        user_id=user_id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Save file using document ID so we can always find it
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    background_tasks.add_task(process_document, str(doc.id), file_path)

    return {
        "document_id": str(doc.id),
        "title": doc.title,
        "status": "processing",
        "message": "Document uploaded. Processing in background."
    }


def process_document(document_id: str, file_path: str):
    """Background task: extract text, chunk it, store in DB."""
    from app.models.database import SessionLocal
    import traceback
    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            print(f"[PROCESS] Document {document_id} not found in DB")
            return

        print(f"[PROCESS] Starting processing for: {doc.title} (file: {file_path})")
        
        extracted = extract_text_from_pdf(file_path)
        print(f"[PROCESS] Extracted {len(extracted['text'])} chars from {extracted['total_pages']} pages")
        
        clean = clean_text(extracted["text"])
        chunks = chunk_text(clean, max_tokens=500, overlap_tokens=50)
        print(f"[PROCESS] Created {len(chunks)} chunks")

        if len(chunks) == 0:
            doc.status = "error"
            doc.total_pages = extracted["total_pages"]
            doc.total_chunks = 0
            doc.updated_at = datetime.utcnow()
            db.commit()
            print(f"[PROCESS] ERROR: 0 chunks created for {doc.title}. PDF might be image-based with no text.")
            return

        for chunk in chunks:
            db_chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
            )
            db.add(db_chunk)

        doc.status = "ready"
        doc.total_pages = extracted["total_pages"]
        doc.total_chunks = len(chunks)
        doc.updated_at = datetime.utcnow()

        db.commit()
        print(f"[PROCESS] SUCCESS: {len(chunks)} chunks stored for {doc.title}")

    except Exception as e:
        import traceback
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            db.commit()
        print(f"[PROCESS] Error processing {document_id}: {e}\n{traceback.format_exc()}")
    finally:
        db.close()


@router.post("/reprocess/{document_id}")
async def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    """Re-process a document (retry text extraction + chunking)."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Find the PDF file by document ID (upload saves as {doc.id}.pdf)
    file_path = os.path.join(UPLOAD_DIR, f"{document_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="PDF file not found for this document")
    
    # Clear existing chunks
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    doc.status = "processing"
    doc.total_chunks = 0
    db.commit()
    
    background_tasks.add_task(process_document, document_id, file_path)
    return {"message": "Re-processing started", "file": f"{document_id}.pdf"}


@router.get("/")
def list_documents(db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()
    return [
        {
            "id": str(d.id),
            "title": d.title,
            "subject": d.subject,
            "status": d.status,
            "total_pages": d.total_pages,
            "total_chunks": d.total_chunks,
            "created_at": d.created_at.isoformat()
        }
        for d in docs
    ]


@router.get("/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).order_by(DocumentChunk.chunk_index).limit(5).all()

    return {
        "id": str(doc.id),
        "title": doc.title,
        "subject": doc.subject,
        "status": doc.status,
        "total_pages": doc.total_pages,
        "total_chunks": doc.total_chunks,
        "sample_chunks": [{"index": c.chunk_index, "content": c.content[:300]} for c in chunks],
        "created_at": doc.created_at.isoformat()
    }


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete associated StudySessions and ChatMessages manually to avoid FK constraint errors
    from app.models.database import StudySession, ChatMessage
    db.query(StudySession).filter(StudySession.document_id == document_id).delete()
    db.query(ChatMessage).filter(ChatMessage.document_id == document_id).delete()
    
    db.delete(doc)
    db.commit()
    
    # Also delete the physical file
    file_path = os.path.join(UPLOAD_DIR, f"{doc.id}.pdf")
    if os.path.exists(file_path):
        os.remove(file_path)
        
    return {"message": "Document deleted"}
