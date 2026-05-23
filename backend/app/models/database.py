from sqlalchemy import create_engine, Column, String, Text, Float, Integer, Boolean, DateTime, ForeignKey, JSON, Uuid
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mnemosyne.db")

try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    Vector = lambda dim: Text  # fallback

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 15})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(200), default="default", index=True)
    title = Column(String(500), nullable=False)
    filename = Column(String(500), nullable=False)
    subject = Column(String(200))
    total_pages = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    status = Column(String(50), default="processing")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete")
    concepts = relationship("Concept", back_populates="document", cascade="all, delete")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer)
    embedding = Column(Vector(384) if HAS_PGVECTOR else Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    name = Column(String(500), nullable=False)
    definition = Column(Text)
    category = Column(String(200))
    difficulty = Column(Integer, default=3)
    prerequisites = Column(JSON, default=list)
    related_concepts = Column(JSON, default=list)
    embedding = Column(Vector(384) if HAS_PGVECTOR else Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="concepts")
    memory_records = relationship("MemoryRecord", back_populates="concept", cascade="all, delete")
    review_items = relationship("ReviewItem", back_populates="concept", cascade="all, delete")


class MemoryRecord(Base):
    __tablename__ = "memory_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    concept_id = Column(String(36), ForeignKey("concepts.id"), nullable=False)
    user_id = Column(String(200), default="default")
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=1)
    repetitions = Column(Integer, default=0)
    retention_score = Column(Float, default=1.0)
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    total_reviews = Column(Integer, default=0)
    correct_reviews = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    concept = relationship("Concept", back_populates="memory_records")


class ReviewItem(Base):
    __tablename__ = "review_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    concept_id = Column(String(36), ForeignKey("concepts.id"), nullable=False)
    question = Column(Text, nullable=False)
    question_type = Column(String(50))
    options = Column(JSON)
    correct_answer = Column(Text)
    explanation = Column(Text)
    difficulty = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

    concept = relationship("Concept", back_populates="review_items")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"))
    user_id = Column(String(200), default="default")
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    concepts_reviewed = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(200), default="default", index=True)
    session_id = Column(String(200))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    context_concepts = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
