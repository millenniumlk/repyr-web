import re

with open('src/pages/BrandCatalog.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('LemonChecker', 'ReliabilityScore')
content = content.replace(\"'lemon'\", \"'reliability'\")
content = content.replace('?? Lemon Checker', 'Reliability Score')

with open('src/pages/BrandCatalog.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
