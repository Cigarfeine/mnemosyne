from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import documents, concepts, memory, recall, tutor
from app.models.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mnemosyne API",
    description="AI-Powered Cognitive Learning Operating System",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(concepts.router, prefix="/api/concepts", tags=["concepts"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(recall.router, prefix="/api/recall", tags=["recall"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["tutor"])

@app.get("/")
def root():
    return {"status": "Mnemosyne API running", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/ai/health")
def ai_health(x_groq_api_key: str = Header(default=None)):
    """Check AI provider status — used by frontend health indicator."""
    from app.services.ai_service import get_ai_health
    return get_ai_health(x_groq_api_key)

@app.get("/api/extraction/progress/{document_id}")
def extraction_progress(document_id: str):
    """Get extraction progress for a document."""
    from sqlalchemy.orm import Session
    from app.models.database import SessionLocal, Document, DocumentChunk, Concept
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return {"status": "not_found"}
        
        total_chunks = doc.total_chunks or 0
        concepts = db.query(Concept).filter(Concept.document_id == document_id).count()
        
        expected_concepts = total_chunks * 2
        estimated_seconds = max(0, (total_chunks - min(concepts, total_chunks)) * 8)
        progress = min(100, int((concepts / max(expected_concepts, 1)) * 100))
        
        is_done = concepts > 0 and (progress >= 90 or doc.status == "ready")
        
        return {
            "status": "done" if is_done else "extracting",
            "total_chunks": total_chunks,
            "concepts_extracted": concepts,
            "estimated_seconds_remaining": estimated_seconds,
            "progress_percent": progress
        }
    finally:
        db.close()

