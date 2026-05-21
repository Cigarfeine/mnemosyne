import pdfplumber
import tiktoken
import re
from typing import List, Dict


def extract_text_from_pdf(file_path: str) -> Dict:
    pages_text = []
    metadata = {}

    with pdfplumber.open(file_path) as pdf:
        metadata = pdf.metadata or {}
        total_pages = len(pdf.pages)

        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append({
                    "page_number": page.page_number,
                    "content": text.strip()
                })

    full_text = "\n\n".join([p["content"] for p in pages_text])

    return {
        "text": full_text,
        "pages": pages_text,
        "total_pages": total_pages,
        "metadata": metadata
    }


def chunk_text(text: str, max_tokens: int = 500, overlap_tokens: int = 50) -> List[Dict]:
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text_str = enc.decode(chunk_tokens)

        chunks.append({
            "chunk_index": chunk_index,
            "content": chunk_text_str.strip(),
            "token_count": len(chunk_tokens),
            "start_token": start,
            "end_token": end
        })

        chunk_index += 1
        start = end - overlap_tokens

    return chunks


def clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'^\d+$', '', text, flags=re.MULTILINE)
    return text.strip()
