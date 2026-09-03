import re

with open('src/components/NHTSASafetyHub.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update props interface
content = re.sub(
    r'export interface NHTSASafetyHubProps \{\s*make: string;\s*model: string;\s*year: string;\s*\}',
    \"export interface NHTSASafetyHubProps {\\n  make: string;\\n  model: string;\\n  year: string;\\n  activeTab: 'recalls' | 'investigations' | 'complaints';\\n}\",
    content
)

# 2. Update component signature and remove activeTab state
content = re.sub(
    r'export function NHTSASafetyHub\(\{ make, model, year \}: NHTSASafetyHubProps\) \{\s*const \[activeTab, setActiveTab\] = useState<SafetyTab>\(\'recalls\'\);',
    \"export function NHTSASafetyHub({ make, model, year, activeTab }: NHTSASafetyHubProps) {\",
    content
)

# 3. Remove handleTabChange
content = re.sub(
    r'  const handleTabChange = \(tab: SafetyTab\) => \{\s*setActiveTab\(tab\);\s*setShowAll\(false\);\s*\};\n',
    '',
    content
)

# 4. Remove the 3-tab segmented selector bar
tablist_pattern = re.compile(r'      \{\/\* 3-tab segmented selector bar \*\/\}.*?(?=      \{\/\* Tab content with Framer Motion transition \*\/\})', re.DOTALL)
content = tablist_pattern.sub('', content)

with open('src/components/NHTSASafetyHub.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
