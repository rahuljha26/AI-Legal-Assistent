import os
import json
from google import genai
from google.genai import types
from django.conf import settings

def get_gemini_advice(query):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    try:
        # Include constitution.json mapping context
        filepath = os.path.join(settings.BASE_DIR, 'AILegal', 'data', 'constitution.json')
        with open(filepath, 'r') as f:
            constitution_data = json.load(f)
            
        context = f"Internal Context regarding Indian Constitution & IPC: {json.dumps(constitution_data)}\n\nQuery: {query}"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=context,
            config=types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.95,
                top_k=64,
                max_output_tokens=8192,
                response_mime_type="application/json",
                system_instruction=(
                    "You are a professional Indian legal advisor AI. For every query:\n"
                    "1. Identify relevant Indian Constitution article or IPC section\n"
                    "2. Provide clear step-by-step guidance (numbered list)\n"
                    "3. List exact documents the user will need\n"
                    "4. Specify exact authority/court/forum to approach\n"
                    "5. State realistic possible outcomes\n"
                    "6. End with: This is for informational purposes only. Consult a licensed advocate.\n\n"
                    "Respond strictly in the following JSON format:\n"
                    "{\n"
                    '  "constitution_reference": "string",\n'
                    '  "applicable_law": "string",\n'
                    '  "steps_to_take": ["string"],\n'
                    '  "documents_required": ["string"],\n'
                    '  "where_to_file": "string",\n'
                    '  "possible_outcomes": ["string"],\n'
                    '  "disclaimer": "This is for informational purposes only. Consult a licensed advocate."\n'
                    "}"
                )
            )
        )
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}

import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def generate_legal_document_text(doc_type, details):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    prompt = f"Generate a proper Indian legal document.\nType: {doc_type}\nDetails: {json.dumps(details)}\nRespond ONLY with the document text."
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Error generating document: {str(e)}"

def create_pdf_buffer(text):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    textobject = p.beginText(40, 750)
    textobject.setFont("Helvetica", 12)
    
    for line in text.split('\n'):
        words = line.split()
        current_line = ""
        for word in words:
            if len(current_line) + len(word) < 90:
                current_line += word + " "
            else:
                textobject.textLine(current_line)
                current_line = word + " "
                if textobject.getY() < 40:
                    p.drawText(textobject)
                    p.showPage()
                    textobject = p.beginText(40, 750)
                    textobject.setFont("Helvetica", 12)
        textobject.textLine(current_line)
        if textobject.getY() < 40:
             p.drawText(textobject)
             p.showPage()
             textobject = p.beginText(40, 750)
             textobject.setFont("Helvetica", 12)

    p.drawText(textobject)
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
