import re

with open('src/pages/OBDDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add dynamicImage state
state_block = \"\"\"  const [codeData, setCodeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicImage, setDynamicImage] = useState<string | null>(null);\"\"\"

content = re.sub(
    r'  const \[codeData, setCodeData\] = useState<any>\(null\);\s*const \[isLoading, setIsLoading\] = useState\(true\);\s*const \[error, setError\] = useState<string \| null>\(null\);\s*const \[isGenerating, setIsGenerating\] = useState\(false\);',
    state_block,
    content
)

# Fetch dynamic image
effect_block = \"\"\"        // Fetch dynamic image
        try {
          const rawQuery = \\ engine bay stock photo\
          const { data: imgData } = await supabase.functions.invoke('fetch-diagrams', {
            body: { 
              rawQuery,
              rawCacheKey: \engine_bay_\\.toLowerCase()
            }
          })
          if (imgData?.images && imgData.images.length > 0) {
            setDynamicImage(imgData.images[0])
          }
        } catch (imgErr) {
          console.error("Failed to fetch dynamic image:", imgErr)
        }

      } catch (err: any) {\"\"\"

content = content.replace('      } catch (err: any) {', effect_block)

# Replace image render
img_render_block = \"\"\"              {/* Image / Diagram */}
              {dynamicImage && (
                <div className="rounded-3xl overflow-hidden border border-border bg-muted">
                  <img 
                    src={dynamicImage} 
                    alt={\\ OBD-II Code Diagnostic Engine Bay\}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                </div>
              )}\"\"\"

content = re.sub(
    r'              \{\/\* Image \/ Diagram \*\/}.*?</div>\s*</div>',
    img_render_block,
    content,
    flags=re.DOTALL
)

with open('src/pages/OBDDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
