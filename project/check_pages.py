import re
import os

def get_pdf_page_count(filepath):
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
            # Look for /Type /Page or /Type/Page
            pages = re.findall(rb'/Type\s*/Page\b', data)
            return len(pages)
    except Exception as e:
        return str(e)

path = r"c:\Users\Dell\OneDrive\Desktop\AI-legal assist project\project\BlackBook harf_merged1.pdf"
print(f"Page Count: {get_pdf_page_count(path)}")
