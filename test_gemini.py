import os

with open('.env') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY='):
            os.environ['GEMINI_API_KEY'] = line.split('=', 1)[1].strip()

from google import genai

client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])

print("Available models:")
for m in client.models.list():
    name = getattr(m, 'name', str(m))
    print(" -", name)
