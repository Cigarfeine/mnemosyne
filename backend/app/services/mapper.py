from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import tiktoken
from app.models.weightage import TopicWeightageMap

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Splits text into token-based chunks using tiktoken."""
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    
    chunks = []
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk_tokens = tokens[i:i + chunk_size]
        chunk_text = enc.decode(chunk_tokens)
        chunks.append(chunk_text)
    return chunks

def map_notes_to_topics(weightage_map: TopicWeightageMap, notes_text: str) -> Dict[str, Any]:
    """
    Chunks the notes and uses TF-IDF cosine similarity to map relevant chunks 
    to each topic in the weightage map. It updates coverage_in_notes and gap_topics.
    Returns the mapped chunks dictionary and updated weightage map.
    """
    if not notes_text.strip():
        # No notes provided, everything is a gap
        for topic in weightage_map.topics:
            topic.coverage_in_notes = 0.0
            topic.gap_topics = [topic.name]
        return {}, weightage_map

    chunks = chunk_text(notes_text)
    if not chunks:
        return {}, weightage_map

    vectorizer = TfidfVectorizer(stop_words='english')
    chunk_vectors = vectorizer.fit_transform(chunks)
    
    mapped_chunks = {}
    
    for topic in weightage_map.topics:
        # Create a query string from topic name and recurring patterns
        query_parts = [topic.name] + topic.recurring_patterns
        query_str = " ".join(query_parts)
        
        query_vec = vectorizer.transform([query_str])
        similarities = cosine_similarity(query_vec, chunk_vectors)[0]
        
        # Get top 5 most similar chunks
        top_indices = similarities.argsort()[-5:][::-1]
        
        relevant_chunks = []
        coverage_score = 0.0
        
        for idx in top_indices:
            sim = similarities[idx]
            if sim > 0.05: # Threshold for relevance
                relevant_chunks.append(chunks[idx])
                coverage_score += sim
                
        # Normalize coverage score (cap at 1.0)
        topic.coverage_in_notes = min(coverage_score, 1.0)
        mapped_chunks[topic.id] = relevant_chunks
        
        # Detect gap
        if topic.coverage_in_notes < 0.2:
            topic.gap_topics.append(topic.name)
            
    return mapped_chunks, weightage_map
