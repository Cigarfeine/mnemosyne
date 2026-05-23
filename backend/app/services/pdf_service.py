import pdfplumber
import fitz  # PyMuPDF
import tiktoken
import re
import base64
import os
import traceback
from typing import List, Dict


def extract_text_from_pdf(file_path: str) -> Dict:
    """Extract text from PDF. Falls back to OCR via AI for image-based PDFs."""
    pages_text = []
    total_pages = 0

    # First try pdfplumber (fast, for text-based PDFs)
    try:
        with pdfplumber.open(file_path) as pdf:
            total_pages = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    pages_text.append({
                        "page_number": page.page_number,
                        "content": text.strip()
                    })
    except Exception as e:
        print(f"pdfplumber error: {e}")

    # If pdfplumber extracted text, use it
    full_text = "\n\n".join([p["content"] for p in pages_text])

    if len(full_text.strip()) > 100:
        print(f"[PDF] Text extracted via pdfplumber: {len(full_text)} chars from {len(pages_text)} pages")
        return {
            "text": full_text,
            "pages": pages_text,
            "total_pages": total_pages,
            "metadata": {}
        }

    # Second try PyMuPDF text extraction before resorting to OCR
    try:
        doc = fitz.open(file_path)
        total_pages = len(doc)
        pages_text = []
        for page_num in range(total_pages):
            text = doc[page_num].get_text()
            if text and text.strip():
                pages_text.append({
                    "page_number": page_num + 1,
                    "content": text.strip()
                })
        doc.close()
        
        full_text = "\n\n".join([p["content"] for p in pages_text])
        if len(full_text.strip()) > 100:
            print(f"[PDF] Text extracted via PyMuPDF get_text: {len(full_text)} chars from {len(pages_text)} pages")
            return {
                "text": full_text,
                "pages": pages_text,
                "total_pages": total_pages,
                "metadata": {}
            }
    except Exception as e:
        print(f"PyMuPDF text extraction error: {e}")

    # Fallback: Image-based PDF — use PyMuPDF to render pages and OCR via AI
    print(f"[PDF] No text found via pdfplumber/fitz. Attempting image-based OCR for {total_pages} pages...")
    pages_text = []

    try:
        import time
        from concurrent.futures import ThreadPoolExecutor, as_completed

        doc = fitz.open(file_path)
        total_pages = len(doc)
        ocr_start = time.time()
        MAX_OCR_SECONDS = 300  # 5 minute timeout for the entire OCR process

        def _ocr_single_page(page_num: int, b64_image: str) -> dict | None:
            """OCR a single page with retry logic. Returns page dict or None."""
            for attempt in range(2):
                try:
                    text = _ocr_with_ai(b64_image, page_num + 1)
                    if text and text.strip():
                        print(f"  Page {page_num + 1}/{total_pages}: {len(text)} chars extracted")
                        return {"page_number": page_num + 1, "content": text.strip()}
                    return None
                except Exception as e:
                    error_str = str(e)
                    if "All OCR providers failed" in error_str:
                        # Both providers tried and failed - no point retrying
                        print(f"  Page {page_num + 1}/{total_pages}: All providers failed, skipping.")
                        return None
                    if attempt == 0 and ("429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "rate" in error_str.lower()):
                        print(f"  Page {page_num + 1}/{total_pages}: Rate limit, retrying in 10s...")
                        time.sleep(10)
                    else:
                        print(f"  Page {page_num + 1}/{total_pages}: OCR failed - {error_str[:120]}")
                        return None
            return None

        # Pre-render all page images (fast, CPU-only)
        page_images = []
        for page_num in range(total_pages):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)  # Lower DPI = smaller images = faster API calls
            img_bytes = pix.tobytes("png")
            b64_image = base64.b64encode(img_bytes).decode("utf-8")
            page_images.append((page_num, b64_image))
        doc.close()

        # Process pages concurrently (3 workers to balance speed vs rate limits)
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(_ocr_single_page, pn, img): pn
                for pn, img in page_images
            }
            for future in as_completed(futures):
                if time.time() - ocr_start > MAX_OCR_SECONDS:
                    print(f"[PDF] OCR timeout reached ({MAX_OCR_SECONDS}s). Returning partial results.")
                    break
                result = future.result()
                if result:
                    pages_text.append(result)

        # Sort by page number since concurrent execution returns out of order
        pages_text.sort(key=lambda p: p["page_number"])

    except Exception as e:
        print(f"[PDF] PyMuPDF OCR failed: {e}")
        traceback.print_exc()

    full_text = "\n\n".join([p["content"] for p in pages_text])
    print(f"[PDF] OCR complete: {len(full_text)} chars from {len(pages_text)} pages")

    return {
        "text": full_text,
        "pages": pages_text,
        "total_pages": total_pages,
        "metadata": {}
    }


def _ocr_with_ai(b64_image: str, page_num: int) -> str:
    """Use AI vision model to extract text from a page image. Auto-falls back between providers."""
    from dotenv import load_dotenv
    load_dotenv(".env")
    
    provider = os.getenv("OCR_PROVIDER", "gemini").lower()
    
    # Try primary provider first, then fallback
    providers = [("gemini", _ocr_gemini), ("groq", _ocr_groq)]
    if provider == "groq":
        providers = [("groq", _ocr_groq), ("gemini", _ocr_gemini)]
    
    last_error = None
    for name, func in providers:
        try:
            result = func(b64_image, page_num)
            return result
        except Exception as e:
            last_error = e
            print(f"  [OCR] {name} failed for page {page_num}: {str(e)[:120]}")
            continue
    
    raise Exception(f"All OCR providers failed for page {page_num}. Last error: {last_error}")


def _ocr_groq(b64_image: str, page_num: int) -> str:
    """OCR using Groq's vision model."""
    from groq import Groq
    
    client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
    
    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Extract ALL the text from this page image exactly as it appears. Preserve the original formatting, headings, bullet points, equations, and structure. Output ONLY the extracted text, nothing else."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{b64_image}"
                    }
                }
            ]
        }],
        max_tokens=4096,
        temperature=0.1,
    )
    
    return response.choices[0].message.content.strip()


def _ocr_gemini(b64_image: str, page_num: int) -> str:
    """OCR using Gemini's vision model."""
    from google import genai
    
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[{
            "role": "user",
            "parts": [
                {"text": "Extract ALL the text from this page image exactly as it appears. Preserve formatting. Output ONLY the extracted text."},
                {"inline_data": {"mime_type": "image/png", "data": b64_image}}
            ]
        }],
        config=genai.types.GenerateContentConfig(max_output_tokens=4096, temperature=0.1)
    )
    
    return response.text.strip()


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
        
        if end >= len(tokens):
            break
            
        start = end - overlap_tokens

    return chunks


def clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'^\d+$', '', text, flags=re.MULTILINE)
    return text.strip()
