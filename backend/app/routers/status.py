from fastapi import APIRouter
from app.routers.pipeline import get_session_status

router = APIRouter()

@router.get("/status/{session_id}")
def get_status(session_id: str):
    """Returns the current pipeline status for polling fallback."""
    return get_session_status(session_id)
