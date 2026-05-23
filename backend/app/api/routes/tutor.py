from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, ChatMessage, Document
from app.services.ai_service import chat_with_tutor
from app.services.rag_service import retrieve_relevant_chunks, get_weak_concept_names
import uuid

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None
    session_id: Optional[str] = None
    study_mode: str = "notes"


@router.post("/chat")
def tutor_chat(request: ChatRequest, db: Session = Depends(get_db)):
    session_id = request.session_id or str(uuid.uuid4())

    context = ""
    weak_concepts = []

    if request.document_id:
        chunks = retrieve_relevant_chunks(request.message, request.document_id, db, top_k=4)
        if chunks:
            context = "\n\n---\n\n".join([c["content"] for c in chunks])
        weak_concepts = get_weak_concept_names(request.document_id, db)

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).limit(20).all()

    history_messages = [{"role": h.role, "content": h.content} for h in history]

    response = chat_with_tutor(request.message, context, weak_concepts, history_messages, study_mode=request.study_mode)

    user_msg = ChatMessage(
        session_id=session_id,
        document_id=request.document_id,
        role="user",
        content=request.message,
        context_concepts=weak_concepts[:5]
    )
    db.add(user_msg)

    assistant_msg = ChatMessage(
        session_id=session_id,
        document_id=request.document_id,
        role="assistant",
        content=response
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "response": response,
        "session_id": session_id,
        "context_used": len(context) > 0,
        "weak_concepts_in_context": weak_concepts[:5]
    }


@router.get("/history/{session_id}")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    return [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in messages]
