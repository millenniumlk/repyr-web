import re

# Fix BrandSelectorGrid
with open('src/components/BrandSelectorGrid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import \{ motion, AnimatePresence \} from \'framer-motion\';', \"import { motion } from 'framer-motion';\", content)
content = re.sub(r'const pickerVariants = \{.*?\};\n', '', content, flags=re.DOTALL)

with open('src/components/BrandSelectorGrid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Fix HomePage
with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'ChevronLeft,\s*', '', content)
content = re.sub(r'\s*const \[selectedMake, setSelectedMake\] = useState<string \| null>\(null\);\n', '', content)
content = re.sub(r'\s*const \[selectedYear, setSelectedYear\] = useState<string>\(\'\'\);\n', '', content)
content = re.sub(r'\s*const \[selectedModel, setSelectedModel\] = useState<string \| null>\(null\);\n', '', content)
content = re.sub(r'\s*const \[showSafety, setShowSafety\] = useState\(false\);\n', '', content)
content = re.sub(r'\s*const \{ data: models, isLoading: isLoadingModels \} = useQuery\(\{.*?\}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*const handleDiagnose = \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
