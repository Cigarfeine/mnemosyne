from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.database import get_db, Concept, ReviewItem, Document
from app.api.auth import get_user_id
from app.services.ai_service import generate_questions_for_concept

router = APIRouter()


@router.post("/generate/{document_id}")
async def generate_questions_for_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    study_mode: str = "notes",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    concepts = db.query(Concept).filter(Concept.document_id == document_id).all()
    if not concepts:
        raise HTTPException(status_code=400, detail="No concepts found. Extract concepts first.")

    existing = db.query(ReviewItem).filter(
        ReviewItem.concept_id.in_([c.id for c in concepts])
    ).count()
    if existing > 0:
        return {"message": f"Questions already generated ({existing} questions)"}

    background_tasks.add_task(run_question_generation, [str(c.id) for c in concepts], study_mode)
    return {"message": f"Generating questions for {len(concepts)} concepts"}


def run_question_generation(concept_ids: list, study_mode: str = "notes"):
    from app.models.database import SessionLocal, Concept, ReviewItem
    db = SessionLocal()

    try:
        for concept_id in concept_ids:
            concept = db.query(Concept).filter(Concept.id == concept_id).first()
            if not concept:
                continue

            try:
                questions = generate_questions_for_concept(
                    concept.name,
                    concept.definition or "No definition available",
                    concept.difficulty,
                    num_questions=3,
                    study_mode=study_mode
                )

                for q in questions:
                    item = ReviewItem(
                        concept_id=concept_id,
                        question=q.get("question", ""),
                        question_type=q.get("question_type", "open_recall"),
                        options=q.get("options"),
                        correct_answer=q.get("correct_answer", ""),
                        explanation=q.get("explanation", ""),
                        difficulty=q.get("difficulty", concept.difficulty)
                    )
                    db.add(item)

                db.commit()

            except Exception as e:
                print(f"Error generating questions for concept {concept.name}: {e}")
                continue

    finally:
        db.close()


@router.get("/questions/{concept_id}")
def get_questions(concept_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    # Verify ownership
    concept = db.query(Concept).join(Document).filter(Concept.id == concept_id, Document.user_id == user_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found or unauthorized")
        
    questions = db.query(ReviewItem).filter(ReviewItem.concept_id == concept_id).all()
    return [
        {
            "id": str(q.id),
            "question": q.question,
            "question_type": q.question_type,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty
        }
        for q in questions
    ]


@router.get("/session/{document_id}")
def get_study_session(document_id: str, study_mode: str = "notes", limit: int = 10, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    from app.models.database import MemoryRecord
    from datetime import datetime

    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    concepts = db.query(Concept).filter(Concept.document_id == document_id).all()
    if not concepts:
        return {"session_items": [], "total_due": 0}

    due_concept_ids = set()
    for c in concepts:
        record = db.query(MemoryRecord).filter(MemoryRecord.concept_id == c.id).first()
        if record and record.next_review and record.next_review <= datetime.utcnow():
            due_concept_ids.add(str(c.id))

    # If no concepts are due, include all (first-time study or all mastered)
    if not due_concept_ids:
        due_concept_ids = {str(c.id) for c in concepts}

    session_items = []
    auto_generated_count = 0
    for c in concepts:
        if str(c.id) not in due_concept_ids:
            continue

        questions = db.query(ReviewItem).filter(ReviewItem.concept_id == c.id).limit(2).all()

        # Auto-generate questions if none exist
        if not questions:
            if auto_generated_count >= 2:
                continue # Skip to avoid long buffering times
            try:
                generated = generate_questions_for_concept(
                    c.name, c.definition or "No definition", c.difficulty,
                    num_questions=3, study_mode=study_mode
                )
                for q in generated:
                    item = ReviewItem(
                        concept_id=c.id,
                        question=q.get("question", ""),
                        question_type=q.get("question_type", "open_recall"),
                        options=q.get("options"),
                        correct_answer=q.get("correct_answer", ""),
                        explanation=q.get("explanation", ""),
                        difficulty=q.get("difficulty", c.difficulty)
                    )
                    db.add(item)
                db.commit()
                questions = db.query(ReviewItem).filter(ReviewItem.concept_id == c.id).limit(2).all()
                auto_generated_count += 1
            except Exception as e:
                print(f"Auto-generation failed for {c.name}: {e}")
                continue

        if questions:
            session_items.append({
                "concept_id": str(c.id),
                "concept_name": c.name,
                "definition": c.definition,
                "questions": [
                    {
                        "id": str(q.id),
                        "question": q.question,
                        "question_type": q.question_type,
                        "options": q.options,
                        "correct_answer": q.correct_answer,
                        "explanation": q.explanation
                    }
                    for q in questions
                ]
            })
        if len(session_items) >= limit:
            break

    return {"session_items": session_items, "total_due": len(due_concept_ids)}
