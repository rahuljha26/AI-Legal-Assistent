import urllib.request
import re

url = 'https://www.lawnow.org/the-rule-of-law-what-is-it-why-should-we-care/'
html = urllib.request.urlopen(url).read().decode('utf-8')
images = set(re.findall(r'(https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp))', html, re.IGNORECASE))
for img in images:
    print(img)
