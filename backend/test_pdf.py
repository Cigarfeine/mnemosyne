from app.services.pdf_service import extract_text_from_pdf, chunk_text, clean_text
import os

pdfs = [f for f in os.listdir('uploads') if f.endswith('.pdf')]
print(f"PDFs found: {pdfs}")

if pdfs:
    result = extract_text_from_pdf(f"uploads/{pdfs[0]}")
    pages = result["total_pages"]
    text = result["text"]
    print(f"Pages: {pages}")
    print(f"Raw text length: {len(text)}")
    print(f"First 300 chars: {repr(text[:300])}")
    
    clean = clean_text(text)
    print(f"Clean text length: {len(clean)}")
    
    chunks = chunk_text(clean, max_tokens=500, overlap_tokens=50)
    print(f"Chunks created: {len(chunks)}")
    if chunks:
        print(f"First chunk: {chunks[0]['content'][:200]}")
else:
    print("No PDFs found in uploads/")
