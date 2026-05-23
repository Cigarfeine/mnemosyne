from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, ChatMessage, Document
from app.api.auth import get_user_id
from app.services.ai_service import chat_with_tutor, chat_with_tutor_stream
from app.services.rag_service import retrieve_relevant_chunks, get_weak_concept_names
import uuid

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None
    session_id: Optional[str] = None
    study_mode: str = "notes"


@router.post("/chat")
def tutor_chat(
    request: ChatRequest, 
    db: Session = Depends(get_db), 
    user_id: str = Depends(get_user_id),
    x_groq_api_key: str = Header(default=None)
):
    if not x_groq_api_key:
        raise HTTPException(status_code=401, detail="X-Groq-Api-Key header missing")

    session_id = request.session_id or str(uuid.uuid4())

    context = ""
    weak_concepts = []

    if request.document_id:
        doc = db.query(Document).filter(Document.id == request.document_id, Document.user_id == user_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
            
        chunks = retrieve_relevant_chunks(request.message, request.document_id, db, top_k=4)
        if chunks:
            context = "\n\n---\n\n".join([c["content"] for c in chunks])
        weak_concepts = get_weak_concept_names(request.document_id, db)

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at).limit(20).all()

    history_messages = [{"role": h.role, "content": h.content} for h in history]

    user_msg = ChatMessage(
        session_id=session_id,
        user_id=user_id,
        document_id=request.document_id,
        role="user",
        content=request.message,
        context_concepts=weak_concepts[:5]
    )
    db.add(user_msg)
    db.commit()

    def generate():
        full_response = ""
        from app.services.ai_service import chat_with_tutor_stream
        for token in chat_with_tutor_stream(x_groq_api_key, request.message, context, weak_concepts, history_messages, request.study_mode):
            full_response += token
            yield token
            
        try:
            from app.models.database import SessionLocal
            db_stream = SessionLocal()
            import re
            stripped_response = re.sub(r'<think>.*?(?:</think>|$)', '', full_response, flags=re.DOTALL).strip()
            
            assistant_msg = ChatMessage(
                session_id=session_id,
                user_id=user_id,
                document_id=request.document_id,
                role="assistant",
                content=stripped_response
            )
            db_stream.add(assistant_msg)
            db_stream.commit()
            db_stream.close()
        except Exception as e:
            print("Error saving assistant message:", e)

    return StreamingResponse(generate(), media_type="text/plain")


@router.post("/chat/stream")
def tutor_chat_stream(
    request: ChatRequest, 
    db: Session = Depends(get_db), 
    user_id: str = Depends(get_user_id),
    x_groq_api_key: str = Header(default=None)
):
    if not x_groq_api_key:
        raise HTTPException(status_code=401, detail="X-Groq-Api-Key header missing")

    session_id = request.session_id or str(uuid.uuid4())
    context = ""
    weak_concepts = []

    if request.document_id:
        doc = db.query(Document).filter(Document.id == request.document_id, Document.user_id == user_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        chunks = retrieve_relevant_chunks(request.message, request.document_id, db, top_k=4)
        if chunks:
            context = "\n\n---\n\n".join([c["content"] for c in chunks])
        weak_concepts = get_weak_concept_names(request.document_id, db)

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at).limit(20).all()
    history_messages = [{"role": h.role, "content": h.content} for h in history]

    user_msg = ChatMessage(
        session_id=session_id,
        user_id=user_id,
        document_id=request.document_id,
        role="user",
        content=request.message,
        context_concepts=weak_concepts[:5]
    )
    db.add(user_msg)
    db.commit()

    def generate():
        full_response = ""
        for token in chat_with_tutor_stream(x_groq_api_key, request.message, context, weak_concepts, history_messages, request.study_mode):
            full_response += token
            yield token
            
        try:
            from app.models.database import SessionLocal
            db_stream = SessionLocal()
            import re
            stripped_response = re.sub(r'<think>.*?(?:</think>|$)', '', full_response, flags=re.DOTALL).strip()
            
            assistant_msg = ChatMessage(
                session_id=session_id,
                user_id=user_id,
                document_id=request.document_id,
                role="assistant",
                content=stripped_response
            )
            db_stream.add(assistant_msg)
            db_stream.commit()
            db_stream.close()
        except Exception as e:
            print("Error saving assistant message:", e)

    return StreamingResponse(generate(), media_type="text/plain")


@router.get("/history/{session_id}")
def get_chat_history(session_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at).all()

    return [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in messages]
