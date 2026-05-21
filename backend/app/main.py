from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import documents, concepts, memory, recall, tutor

app = FastAPI(
    title="Mnemosyne API",
    description="AI-Powered Cognitive Learning Operating System",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
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
