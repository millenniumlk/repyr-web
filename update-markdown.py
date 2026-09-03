import re

with open('src/pages/OBDDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'import ReactMarkdown' not in content:
    content = content.replace(\"import { Button } from '../components/ui/Button';\", \"import { Button } from '../components/ui/Button';\\nimport ReactMarkdown from 'react-markdown';\")

# Replace rendering block
old_render = \"\"\"              {/* Full Article */}
              {codeData.description && (
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
                    <Settings className="w-6 h-6 text-primary" />
                    What does the {safeCode} code mean?
                  </h2>
                  <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {codeData.description}
                  </div>
                </div>
              )}\"\"\"

new_render = \"\"\"              {/* Full Article */}
              {codeData.description && (
                <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-muted-foreground prose-strong:text-foreground">
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-foreground not-prose">
                    <Settings className="w-6 h-6 text-primary" />
                    What does the {safeCode} code mean?
                  </h2>
                  <ReactMarkdown>
                    {codeData.description}
                  </ReactMarkdown>
                </div>
              )}\"\"\"

content = content.replace(old_render, new_render)

with open('src/pages/OBDDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
