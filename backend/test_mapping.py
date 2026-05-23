from app.models.database import SessionLocal, Document
import os

db = SessionLocal()
d = db.query(Document).first()
doc_id = str(d.id)
print(f"Doc ID: {doc_id}")
print(f"Filename: {d.filename}")
print(f"Status: {d.status}")
print(f"Chunks: {d.total_chunks}")

path_docid = f"uploads/{doc_id}.pdf"
print(f"File at uploads/{{doc_id}}.pdf exists: {os.path.exists(path_docid)}")

for f in os.listdir("uploads"):
    if f.endswith(".pdf"):
        print(f"  upload: {f} ({os.path.getsize(f'uploads/{f}')} bytes)")

db.close()
