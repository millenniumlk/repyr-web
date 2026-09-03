import re

with open('src/components/NHTSASafetyHub.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'import \{ AlertTriangle, FileText, MessageSquare, ChevronDown \} from \'lucide-react\';',
    \"import { AlertTriangle, ChevronDown } from 'lucide-react';\",
    content
)

content = re.sub(
    r'  const investigationsCount = investigationsData\?\.Count \?\? investigations\.length;\n',
    '',
    content
)

with open('src/components/NHTSASafetyHub.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
