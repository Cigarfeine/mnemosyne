from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Header
from sqlalchemy.orm import Session
from app.models.database import get_db, Document, DocumentChunk, Concept, MemoryRecord
from app.api.auth import get_user_id
from app.services.ai_service import extract_concepts_from_chunk
import networkx as nx
from datetime import datetime, timedelta

router = APIRouter()


@router.post("/extract/{document_id}")
async def extract_concepts(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id),
    x_groq_api_key: str = Header(default=None)
):
    if not x_groq_api_key:
        raise HTTPException(status_code=401, detail="X-Groq-Api-Key header missing")

    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail="Document is not ready for processing")

    existing = db.query(Concept).filter(Concept.document_id == document_id).count()
    if existing > 0:
        return {"message": f"Concepts already extracted ({existing} concepts)", "count": existing}

    background_tasks.add_task(run_concept_extraction, document_id, user_id, x_groq_api_key)

    return {"message": "Concept extraction started", "document_id": document_id}


def run_concept_extraction(document_id: str, user_id: str, api_key: str):
    from app.models.database import SessionLocal
    db = SessionLocal()

    try:
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).order_by(DocumentChunk.chunk_index).all()

        seen_concept_names = set()
        
        existing = db.query(Concept).filter(Concept.document_id == document_id).all()
        for e in existing:
            seen_concept_names.add(e.name.lower())

        total_extracted = 0

        for chunk in chunks:
            chunk_concepts = []
            try:
                concepts = extract_concepts_from_chunk(api_key, chunk.content)
                for c in concepts:
                    name = c.get("name", "").strip()
                    if name and name.lower() not in seen_concept_names:
                        seen_concept_names.add(name.lower())
                        chunk_concepts.append(c)
            except Exception as e:
                print(f"Error extracting from chunk {chunk.chunk_index}: {e}")
                continue

            for c in chunk_concepts:
                concept = Concept(
                    document_id=document_id,
                    name=c.get("name", ""),
                    definition=c.get("definition", ""),
                    category=c.get("category", "General"),
                    difficulty=c.get("difficulty", 3),
                    prerequisites=c.get("prerequisites", []),
                    related_concepts=c.get("related_concepts", [])
                )
                db.add(concept)
                db.flush()

                memory = MemoryRecord(
                    concept_id=concept.id,
                    user_id=user_id,
                    next_review=datetime.utcnow()
                )
                db.add(memory)
                total_extracted += 1

            db.commit()

        print(f"Extracted {total_extracted} concepts from document {document_id}")

    except Exception as e:
        print(f"Concept extraction failed for {document_id}: {e}")
        db.rollback()
    finally:
        db.close()


@router.get("/{document_id}")
def list_concepts(document_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    concepts = db.query(Concept).filter(Concept.document_id == document_id).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "definition": c.definition,
            "category": c.category,
            "difficulty": c.difficulty,
            "prerequisites": c.prerequisites,
            "related_concepts": c.related_concepts
        }
        for c in concepts
    ]


@router.get("/graph/{document_id}")
def get_knowledge_graph(document_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    concepts = db.query(Concept).filter(Concept.document_id == document_id).all()
    if not concepts:
        return {"nodes": [], "edges": []}

    G = nx.DiGraph()
    concept_map = {c.name.lower(): c for c in concepts}

    for c in concepts:
        G.add_node(c.name)

    edges_added = set()
    for c in concepts:
        for prereq in (c.prerequisites or []):
            if prereq.lower() in concept_map and (prereq, c.name) not in edges_added:
                G.add_edge(prereq, c.name, type="prerequisite")
                edges_added.add((prereq, c.name))
        for related in (c.related_concepts or []):
            if related.lower() in concept_map and (c.name, related) not in edges_added:
                G.add_edge(c.name, related, type="related")
                edges_added.add((c.name, related))

    nodes = []
    edges = []

    cols = 4
    for i, c in enumerate(concepts):
        row = i // cols
        col = i % cols
        nodes.append({
            "id": str(c.id),
            "data": {
                "label": c.name,
                "definition": c.definition,
                "category": c.category,
                "difficulty": c.difficulty
            },
            "position": {"x": col * 200 + 50, "y": row * 150 + 50},
            "type": "conceptNode"
        })

    for i, (u, v, data) in enumerate(G.edges(data=True)):
        source_concept = next((c for c in concepts if c.name == u), None)
        target_concept = next((c for c in concepts if c.name == v), None)
        if source_concept and target_concept:
            edges.append({
                "id": f"e{i}",
                "source": str(source_concept.id),
                "target": str(target_concept.id),
                "type": data.get("type", "related"),
                "animated": data.get("type") == "prerequisite"
            })

    return {"nodes": nodes, "edges": edges, "total_concepts": len(concepts)}
