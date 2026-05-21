"""
Generate text embeddings for semantic search.
Uses a lightweight local model to avoid API costs.
"""
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False
    model = None


def embed_text(text: str) -> list:
    if not HAS_EMBEDDINGS:
        return []
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def embed_batch(texts: list) -> list:
    if not HAS_EMBEDDINGS:
        return [[] for _ in texts]
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return embeddings.tolist()
