from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import get_db, Concept, MemoryRecord, Document
from app.services.memory_service import sm2_update, calculate_retention, get_review_priority
from datetime import datetime, timedelta

router = APIRouter()


class ReviewSubmission(BaseModel):
    concept_id: str
    quality: int


@router.get("/due")
def get_due_reviews(limit: int = 20, db: Session = Depends(get_db)):
    now = datetime.utcnow()

    records = db.query(MemoryRecord).filter(
        MemoryRecord.next_review <= now + timedelta(hours=1)
    ).all()

    results = []
    for record in records:
        concept = db.query(Concept).filter(Concept.id == record.concept_id).first()
        if not concept:
            continue

        days_since = 0
        if record.last_reviewed:
            days_since = (now - record.last_reviewed).total_seconds() / 86400

        retention = calculate_retention(record.ease_factor, record.interval, days_since)
        priority = get_review_priority(retention, concept.difficulty)

        record.retention_score = retention
        db.commit()

        results.append({
            "concept_id": str(concept.id),
            "concept_name": concept.name,
            "definition": concept.definition,
            "category": concept.category,
            "difficulty": concept.difficulty,
            "retention_score": round(retention, 3),
            "priority": round(priority, 3),
            "interval": record.interval,
            "repetitions": record.repetitions,
            "last_reviewed": record.last_reviewed.isoformat() if record.last_reviewed else None,
            "next_review": record.next_review.isoformat() if record.next_review else None
        })

    results.sort(key=lambda x: x["priority"], reverse=True)
    return results[:limit]


@router.post("/review")
def submit_review(submission: ReviewSubmission, db: Session = Depends(get_db)):
    if submission.quality < 0 or submission.quality > 5:
        raise HTTPException(status_code=400, detail="Quality must be 0-5")

    record = db.query(MemoryRecord).filter(
        MemoryRecord.concept_id == submission.concept_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Memory record not found")

    new_ef, new_interval, new_reps = sm2_update(
        record.ease_factor, record.interval, record.repetitions, submission.quality
    )

    now = datetime.utcnow()
    record.ease_factor = new_ef
    record.interval = new_interval
    record.repetitions = new_reps
    record.last_reviewed = now
    record.next_review = now + timedelta(days=new_interval)
    record.total_reviews += 1

    if submission.quality >= 3:
        record.correct_reviews += 1
        record.streak += 1
    else:
        record.streak = 0

    db.commit()

    return {
        "concept_id": submission.concept_id,
        "quality": submission.quality,
        "new_interval": new_interval,
        "new_ease_factor": round(new_ef, 3),
        "next_review": record.next_review.isoformat(),
        "streak": record.streak
    }


@router.get("/stats")
def get_memory_stats(db: Session = Depends(get_db)):
    records = db.query(MemoryRecord).all()
    if not records:
        return {"total_concepts": 0}

    total = len(records)
    avg_retention = sum(r.retention_score for r in records) / total
    mastered = sum(1 for r in records if r.retention_score >= 0.8)
    weak = sum(1 for r in records if r.retention_score < 0.4)
    due_now = sum(1 for r in records if r.next_review and r.next_review <= datetime.utcnow())

    return {
        "total_concepts": total,
        "average_retention": round(avg_retention, 3),
        "mastered_concepts": mastered,
        "weak_concepts": weak,
        "due_for_review": due_now,
        "total_reviews": sum(r.total_reviews for r in records),
        "overall_accuracy": round(
            sum(r.correct_reviews for r in records) / max(sum(r.total_reviews for r in records), 1), 3
        )
    }


@router.get("/weak-concepts")
def get_weak_concepts(threshold: float = 0.5, db: Session = Depends(get_db)):
    records = db.query(MemoryRecord).filter(
        MemoryRecord.retention_score < threshold
    ).all()

    result = []
    for r in records:
        concept = db.query(Concept).filter(Concept.id == r.concept_id).first()
        if concept:
            result.append({
                "concept_id": str(concept.id),
                "concept_name": concept.name,
                "retention_score": round(r.retention_score, 3),
                "difficulty": concept.difficulty
            })

    result.sort(key=lambda x: x["retention_score"])
    return result
