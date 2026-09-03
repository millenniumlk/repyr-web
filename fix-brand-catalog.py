import re

with open('src/pages/BrandCatalog.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for OEMPartsCatalog
if 'import { OEMPartsCatalog }' not in content:
    content = content.replace(\"import { NHTSASafetyHub } from '../components/NHTSASafetyHub';\", \"import { NHTSASafetyHub } from '../components/NHTSASafetyHub';\nimport { OEMPartsCatalog } from '../components/OEMPartsCatalog';\")

# 2. Add state for tabs
if 'const [activeTab' not in content:
    content = content.replace(\"const selectedYear = paramYear || '';\", \"const selectedYear = paramYear || '';\n  const [activeTab, setActiveTab] = useState<'safety' | 'parts'>('parts');\")

# 3. Replace the NHTSASafetyHub rendering with Tabs
tabs_ui = \"\"\"
            {selectedYear ? (
              <div className=\"mt-8\">
                <div className=\"flex items-center gap-2 mb-8 bg-muted/50 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0\">
                  <button
                    onClick={() => setActiveTab('parts')}
                    className={\px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    OEM Parts Catalog
                  </button>
                  <button
                    onClick={() => setActiveTab('safety')}
                    className={\px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer \\}
                  >
                    Safety & Recalls
                  </button>
                </div>

                {activeTab === 'parts' ? (
                  <OEMPartsCatalog make={safeMake} model={selectedModel} year={selectedYear} />
                ) : (
                  <NHTSASafetyHub make={safeMake} model={selectedModel} year={selectedYear} />
                )}
              </div>
            ) : (
\"\"\"

content = re.sub(r'\{\s*selectedYear\s*\?\s*\(\s*<NHTSASafetyHub[^>]+>\s*\)\s*:\s*\(', tabs_ui, content)

with open('src/pages/BrandCatalog.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
