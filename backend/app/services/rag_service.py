from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.database import DocumentChunk, MemoryRecord, Concept
from app.services.embedding_service import embed_text, HAS_EMBEDDINGS


def retrieve_relevant_chunks(query: str, document_id: str, db: Session, top_k: int = 5) -> list:
    if HAS_EMBEDDINGS:
        sample = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id,
            DocumentChunk.embedding.isnot(None)
        ).first()

        if sample:
            query_embedding = embed_text(query)
            embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"

            results = db.execute(text("""
                SELECT content, chunk_index,
                       1 - (embedding <=> :embedding::vector) as similarity
                FROM document_chunks
                WHERE document_id = :doc_id
                  AND embedding IS NOT NULL
                ORDER BY embedding <=> :embedding::vector
                LIMIT :k
            """), {"embedding": embedding_str, "doc_id": document_id, "k": top_k}).fetchall()

            return [{"content": r[0], "chunk_index": r[1], "similarity": r[2]} for r in results]

    query_words = set(query.lower().split())
    stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
                  'on', 'with', 'at', 'by', 'from', 'it', 'this', 'that', 'what',
                  'which', 'who', 'how', 'when', 'where', 'why', 'and', 'or', 'not',
                  'but', 'if', 'then', 'so', 'than', 'too', 'very', 'just', 'about',
                  'me', 'my', 'i', 'you', 'your', 'we', 'our', 'they', 'their'}
    query_keywords = query_words - stop_words

    all_chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).order_by(DocumentChunk.chunk_index).all()

    if not query_keywords or not all_chunks:
        return [{"content": c.content, "chunk_index": c.chunk_index, "similarity": 1.0} for c in all_chunks[:top_k]]

    scored = []
    for c in all_chunks:
        chunk_words = set(c.content.lower().split())
        overlap = len(query_keywords & chunk_words)
        scored.append((c, overlap))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:top_k]
    return [{"content": c.content, "chunk_index": c.chunk_index, "similarity": score / max(len(query_keywords), 1)} for c, score in top]


def get_weak_concept_names(document_id: str, db: Session, threshold: float = 0.5) -> list:
    concepts = db.query(Concept).filter(Concept.document_id == document_id).all()
    weak = []
    for c in concepts:
        record = db.query(MemoryRecord).filter(MemoryRecord.concept_id == c.id).first()
        if record and record.retention_score < threshold:
            weak.append(c.name)
    return weak
