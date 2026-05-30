import os
import pdfplumber
import fitz  # PyMuPDF
from PIL import Image
from typing import List, Tuple
from app.services.llm_router import process_with_gemini_flash
from io import BytesIO

def extract_text_from_pdf(pdf_path: str, source_type: str, api_key: str = None) -> str:
    """
    Extracts text from a PDF.
    If the text yield is very low (scanned PDF), it falls back to PyMuPDF image extraction
    and uses Gemini Flash for OCR.
    """
    full_text = []
    
    # Pass 1: Try pdfplumber for standard text extraction
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text.append(text)
    except Exception as e:
        print(f"pdfplumber failed: {e}")
        
    combined_text = "\n".join(full_text)
    
    # If we extracted decent text, we are done
    if len(combined_text.strip()) > 100 * len(full_text) and len(full_text) > 0:
        return f"[{source_type.upper()}]\n{combined_text}"
        
    print(f"Low text yield detected in {pdf_path}. Falling back to OCR with Gemini Flash.")
    
    # Pass 2: Scanned PDF fallback using PyMuPDF and Gemini Flash OCR
    ocr_text = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for better OCR
            
            # Convert PyMuPDF pixmap to PIL Image
            img_data = pix.tobytes("png")
            img = Image.open(BytesIO(img_data))
            
            # Use Gemini Flash to OCR the image
            prompt = "Extract all the text from this page exactly as it appears. Do not add any conversational filler."
            text = process_with_gemini_flash(prompt=prompt, images=[img], api_key=api_key)
            ocr_text.append(text)
            
    except Exception as e:
        print(f"OCR fallback failed: {e}")
        return f"[{source_type.upper()}]\n{combined_text}" # Return whatever we got from pass 1
        
    final_text = "\n".join(ocr_text)
    return f"[{source_type.upper()}]\n{final_text}"
