import re

with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused imports
content = re.sub(r'import \{ motion, AnimatePresence \} from \'framer-motion\';', 'import { motion } from \'framer-motion\';', content)
content = re.sub(r'import \{ NHTSASafetyHub \} from \'../components/NHTSASafetyHub\';\n', '', content)
content = re.sub(r'import \{ Search, ArrowRight, Activity, ShieldAlert, BookOpen, MessageSquare, ChevronLeft \} from \'lucide-react\';', 'import { Search, ArrowRight, Activity, ShieldAlert, BookOpen, MessageSquare } from \'lucide-react\';', content)
content = re.sub(r'import \{ Skeleton \} from \'../components/ui/Skeleton\';\n', '', content)

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
