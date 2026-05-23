"""Re-process the document: find the correct PDF, extract text, chunk, and store."""
from app.models.database import SessionLocal, Document, DocumentChunk
from app.services.pdf_service import extract_text_from_pdf, chunk_text, clean_text
import os
import traceback

db = SessionLocal()

try:
    doc = db.query(Document).first()
    if not doc:
        print("No documents in DB")
        exit()
    
    print(f"Document: {doc.title} (ID: {doc.id})")
    print(f"Current status: {doc.status}, chunks: {doc.total_chunks}")
    
    # Find the PDF file - try the most recent 1.2MB file (Permutation and Combination)
    uploads = []
    for f in os.listdir("uploads"):
        if f.endswith(".pdf"):
            size = os.path.getsize(f"uploads/{f}")
            mtime = os.path.getmtime(f"uploads/{f}")
            uploads.append((f, size, mtime))
    
    # Sort by modification time, newest first
    uploads.sort(key=lambda x: x[2], reverse=True)
    print(f"\nMost recent uploads:")
    for name, size, mtime in uploads[:3]:
        print(f"  {name} - {size} bytes")
    
    # Use the most recent upload
    pdf_file = f"uploads/{uploads[0][0]}"
    print(f"\nProcessing: {pdf_file}")
    
    # Extract text
    result = extract_text_from_pdf(pdf_file)
    print(f"Pages: {result['total_pages']}")
    print(f"Text length: {len(result['text'])}")
    
    if len(result['text']) == 0:
        print("ERROR: PDF extraction returned EMPTY text!")
        print("This PDF might be image-based (scanned). pdfplumber cannot extract text from images.")
        exit()
    
    print(f"First 200 chars: {result['text'][:200]}")
    
    # Clean and chunk
    clean = clean_text(result['text'])
    print(f"Clean text length: {len(clean)}")
    
    chunks = chunk_text(clean, max_tokens=500, overlap_tokens=50)
    print(f"Chunks created: {len(chunks)}")
    
    # Delete existing chunks
    db.query(DocumentChunk).filter(DocumentChunk.document_id == str(doc.id)).delete()
    
    # Store new chunks
    for chunk in chunks:
        db_chunk = DocumentChunk(
            document_id=str(doc.id),
            chunk_index=chunk["chunk_index"],
            content=chunk["content"],
        )
        db.add(db_chunk)
    
    # Update document
    doc.total_pages = result["total_pages"]
    doc.total_chunks = len(chunks)
    doc.status = "ready"
    
    db.commit()
    print(f"\nSUCCESS: Stored {len(chunks)} chunks for document {doc.id}")
    
    # Verify
    stored = db.query(DocumentChunk).filter(DocumentChunk.document_id == str(doc.id)).count()
    print(f"Verified: {stored} chunks in database")

except Exception as e:
    print(f"ERROR: {e}")
    traceback.print_exc()
finally:
    db.close()
