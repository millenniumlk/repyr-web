import re

with open('src/components/ReliabilityScore.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('LemonChecker', 'ReliabilityScore')
content = content.replace('Lemon Checker', 'Reliability Score')
content = content.replace('Running Lemon Checker algorithm...', 'Calculating reliability score...')
content = content.replace('High Risk (Lemon)', 'High Risk')

with open('src/components/ReliabilityScore.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
