from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class Topic(BaseModel):
    id: str = Field(..., description="A unique slug for the topic, e.g., 'exception_handling'")
    name: str = Field(..., description="Display name of the topic")
    frequency: int = Field(..., description="How many times this topic appeared across all analyzed PYQs")
    total_marks: int = Field(..., description="Total marks allocated to this topic across all PYQs")
    weight: float = Field(..., description="Normalized weight of this topic (0.0 to 1.0) based on marks/frequency")
    confidence: float = Field(..., description="Confidence score (0.0 to 1.0) of the AI in identifying this topic accurately")
    question_types: Dict[str, int] = Field(default_factory=dict, description="Count of different question types, e.g., {'theory': 4, 'program': 5}")
    recurring_patterns: List[str] = Field(default_factory=list, description="Specific patterns noticed in how questions are asked for this topic")
    coverage_in_notes: Optional[float] = Field(None, description="Score (0.0 to 1.0) indicating how well this topic is covered in the user's notes. Populated later in the pipeline.")
    gap_topics: List[str] = Field(default_factory=list, description="Subtopics present in PYQs but missing from the notes. Populated later in the pipeline.")

class PredictedQuestion(BaseModel):
    question: str = Field(..., description="The predicted question text")
    probability: float = Field(..., description="Probability (0.0 to 1.0) of this question appearing in the next exam")
    marks: int = Field(..., description="Expected marks for this question")
    topic_id: str = Field(..., description="The ID of the topic this question belongs to")

class TopicWeightageMap(BaseModel):
    subject: str = Field(..., description="The overarching subject name, e.g., 'Object Oriented Programming Using Java'")
    total_papers_analysed: int = Field(..., description="Total number of PYQ papers analyzed")
    total_questions_analysed: int = Field(..., description="Total number of individual questions analyzed")
    topics: List[Topic] = Field(default_factory=list, description="List of all identified topics, usually sorted by weight descending")
    paper_patterns: List[str] = Field(default_factory=list, description="General patterns observed across the papers (e.g., 'Module 3 carries highest marks')")
    predicted_questions: List[PredictedQuestion] = Field(default_factory=list, description="List of high-probability predicted questions")
