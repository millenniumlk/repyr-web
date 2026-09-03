import re

with open('src/pages/BrandCatalog.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add LemonChecker import
if 'LemonChecker' not in content:
    content = content.replace(
        \"import { OEMPartsCatalog } from '../components/OEMPartsCatalog';\",
        \"import { OEMPartsCatalog } from '../components/OEMPartsCatalog';\\nimport { LemonChecker } from '../components/LemonChecker';\"
    )

# Update state type
content = re.sub(
    r\"const \[activeTab, setActiveTab\] = useState\<\'parts\' \| \'recalls\' \| \'investigations\' \| \'complaints\'\>\(\'parts\'\);\",
    \"const [activeTab, setActiveTab] = useState<'parts' | 'lemon' | 'recalls' | 'investigations' | 'complaints'>('lemon');\",
    content
)

# Update tab buttons
tabs_ui = \"\"\"
                <div className=\"flex flex-wrap items-center gap-2 mb-8 bg-muted/50 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0\">
                  <button
                    onClick={() => setActiveTab('lemon')}
                    className={\px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    ?? Lemon Checker
                  </button>
                  <button
                    onClick={() => setActiveTab('parts')}
                    className={\px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    OEM Parts
                  </button>
                  <button
                    onClick={() => setActiveTab('recalls')}
                    className={\px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    Recalls
                  </button>
                  <button
                    onClick={() => setActiveTab('investigations')}
                    className={\px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    Investigations
                  </button>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className={\px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    Complaints
                  </button>
                </div>

                {activeTab === 'lemon' ? (
                  <LemonChecker make={safeMake} model={selectedModel} year={selectedYear} />
                ) : activeTab === 'parts' ? (
                  <OEMPartsCatalog make={safeMake} model={selectedModel} year={selectedYear} />
                ) : (
                  <NHTSASafetyHub make={safeMake} model={selectedModel} year={selectedYear} activeTab={activeTab} />
                )}
\"\"\"

content = re.sub(
    r'<div className=\"flex flex-wrap items-center gap-2 mb-8 bg-muted/50 p-1\.5 rounded-2xl w-fit mx-auto sm:mx-0\">.*?</NHTSASafetyHub>',
    tabs_ui.strip(),
    content,
    flags=re.DOTALL
)

with open('src/pages/BrandCatalog.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
