from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import upload, pipeline, status, download

app = FastAPI(
    title="PYQ Study Guide Generator API",
    description="Backend for analyzing PYQs and generating study guides",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(pipeline.router, prefix="/api", tags=["pipeline"])
app.include_router(status.router, prefix="/api", tags=["status"])
app.include_router(download.router, prefix="/api", tags=["download"])

@app.get("/")
def root():
    return {"status": "Study Guide Generator API running", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
