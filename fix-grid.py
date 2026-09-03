import re

with open('src/components/BrandSelectorGrid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused imports
content = re.sub(r'import \{ motion, AnimatePresence \} from \'framer-motion\';', 'import { motion } from \'framer-motion\';', content)
content = re.sub(r'import \{ Button \} from \'\./ui/Button\';\n', '', content)
content = re.sub(r'const pickerVariants = \{.*?\};\n\n', '', content, flags=re.DOTALL)

# Remove unused props
content = re.sub(r'  selectedYear\?.*?onDiagnose\?: \(\) => void;\n', '', content, flags=re.DOTALL)

with open('src/components/BrandSelectorGrid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
