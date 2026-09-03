import re

with open('src/pages/OBDDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_ui = \"\"\"
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="inline-block px-3 py-1 bg-secondary rounded-full text-sm font-bold text-muted-foreground mb-4">
                  {safeMake}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                  {safeCode}: {codeData.title}
                </h1>
              </div>

              {/* Quick Answer Box */}
              <div className="bg-muted/30 border-l-4 border-primary p-6 rounded-r-2xl">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  ? Quick Answer
                </h2>
                {codeData.quick_answer && (
                  <p className="text-foreground/90 font-medium mb-4 text-lg">
                    {codeData.quick_answer}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  {codeData.severity && (
                    <div className="bg-background border border-border px-4 py-2 rounded-xl">
                      <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Severity</span>
                      <span className={ont-black }>{codeData.severity}</span>
                    </div>
                  )}
                  {codeData.drivability && (
                    <div className="bg-background border border-border px-4 py-2 rounded-xl flex-1 min-w-[200px]">
                      <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Drivability</span>
                      <span className="font-semibold text-sm">{codeData.drivability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline CTA */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Diagnose this {safeCode} code with AI
                  </h3>
                  <p className="text-sm text-muted-foreground">Skip the guesswork. Let our AI Master Tech pinpoint the exact failing part on your specific {safeMake}.</p>
                </div>
                <Button onClick={() => navigate('/diagnose')} className="shrink-0 shadow-button-primary" size="lg">
                  Start AI Diagnosis
                </Button>
              </div>

              {/* Image / Diagram */}
              <div className="rounded-3xl overflow-hidden border border-border bg-muted">
                <img 
                  src="https://images.unsplash.com/photo-1486262715619-670810f08960?auto=format&fit=crop&q=80&w=1200&h=600" 
                  alt={${safeCode} OBD-II Code Diagnostic Engine Bay}
                  className="w-full h-64 object-cover"
                />
              </div>

              {/* Full Article */}
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
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                {codeData.symptoms && codeData.symptoms.length > 0 && (
                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Common Symptoms
                    </h2>
                    <ul className="space-y-2">
                      {codeData.symptoms.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {codeData.causes && codeData.causes.length > 0 && (
                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-destructive" />
                      Potential Causes
                    </h2>
                    <ul className="space-y-2">
                      {codeData.causes.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {codeData.fixes && codeData.fixes.length > 0 && (
                <div className="bg-card rounded-2xl p-6 md:p-8 border border-border">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-green-500" />
                    How to Fix {safeCode}
                  </h2>
                  <ul className="space-y-3">
                    {codeData.fixes.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-sm font-bold shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-foreground/90 mt-0.5">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQs Section */}
              {codeData.faqs && codeData.faqs.length > 0 && (
                <div className="pt-8 border-t border-border">
                  <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {codeData.faqs.map((faq: any, i: number) => (
                      <div key={i} className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-2 text-foreground">{faq.question}</h3>
                        <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar / Conversion Funnel */}
            <div className="space-y-6">
              {codeData.estimated_cost && (
                <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Estimated Repair Cost
                  </h3>
                  <p className="text-2xl font-black text-foreground mb-1">{codeData.estimated_cost}</p>
                  <p className="text-sm text-muted-foreground">Includes parts and labor at a typical shop.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
\"\"\"

content = re.sub(
    r'\) : \(\s*<div className="grid lg:grid-cols-3 gap-8">.*?</Helmet>',
    new_ui,
    content,
    flags=re.DOTALL
)

with open('src/pages/OBDDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
