from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.database import get_db, Document, DocumentChunk
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
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        title=file.filename.replace(".pdf", ""),
        filename=file.filename,
        subject=subject,
        status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

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
    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        extracted = extract_text_from_pdf(file_path)
        clean = clean_text(extracted["text"])
        chunks = chunk_text(clean, max_tokens=500, overlap_tokens=50)

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

    except Exception as e:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = "error"
            db.commit()
        print(f"Error processing document {document_id}: {e}")
    finally:
        db.close()


@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
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
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
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
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
