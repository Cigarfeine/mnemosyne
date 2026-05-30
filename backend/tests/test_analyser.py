import pytest
import json
from unittest.mock import patch
from app.services.analyser import analyze_pyqs
from app.models.weightage import TopicWeightageMap

# Mock JSON response from Gemini
MOCK_GEMINI_RESPONSE = {
    "subject": "Object Oriented Programming Using Java",
    "total_papers_analysed": 2,
    "total_questions_analysed": 16,
    "topics": [
        {
            "id": "exception_handling",
            "name": "Exception Handling",
            "frequency": 6,
            "total_marks": 36,
            "weight": 0.6,
            "confidence": 0.95,
            "question_types": {
                "theory": 4,
                "program": 2
            },
            "recurring_patterns": [
                "Checked vs unchecked exceptions",
                "User-defined exception programs"
            ],
            "coverage_in_notes": None,
            "gap_topics": []
        },
        {
            "id": "inheritance_interfaces",
            "name": "Inheritance & Interfaces",
            "frequency": 2,
            "total_marks": 18,
            "weight": 0.3,
            "confidence": 0.9,
            "question_types": {
                "theory": 1,
                "program": 1
            },
            "recurring_patterns": [
                "Types of inheritance",
                "Interface examples"
            ],
            "coverage_in_notes": None,
            "gap_topics": []
        }
    ],
    "paper_patterns": [
        "Programs carry high marks in Part B"
    ],
    "predicted_questions": [
        {
            "question": "Write a Java program to demonstrate user-defined exception handling.",
            "probability": 0.9,
            "marks": 9,
            "topic_id": "exception_handling"
        }
    ]
}

@patch('app.services.analyser.analyze_with_gemini_pro')
def test_analyze_pyqs(mock_analyze):
    # Setup mock to return JSON string
    mock_analyze.return_value = json.dumps(MOCK_GEMINI_RESPONSE)
    
    # Read the mock PYQ text
    with open('tests/fixtures/mock_pyq.txt', 'r') as f:
        pyq_text = f.read()
        
    # Run the analyser
    result = analyze_pyqs(pyq_text)
    
    # Assertions based on Phase 5 requirements
    assert isinstance(result, TopicWeightageMap)
    assert result.subject == "Object Oriented Programming Using Java"
    assert result.total_papers_analysed == 2
    
    # Assert top topic is exception handling
    top_topic = result.topics[0]
    assert top_topic.id == "exception_handling"
    
    # Assert weights roughly sum to 1.0 (or close to it based on our mock data)
    total_weight = sum(t.weight for t in result.topics)
    assert 0.8 < total_weight <= 1.0
