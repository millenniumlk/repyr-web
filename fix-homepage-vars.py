import re

with open('src/pages/HomePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused state variables and functions
content = re.sub(r'  const \[selectedMake, setSelectedMake\] = useState<string \| null>\(null\);\n  const \[selectedYear, setSelectedYear\] = useState<string>\(\'\'\);\n  const \[showSafety, setShowSafety\] = useState\(false\);\n', '', content)

content = re.sub(r'  const \{\s*data: models = \[\],\s*isLoading: isLoadingModels\s*\} = useQuery\(\{\s*queryKey: \[\'models\', selectedMake\],\s*queryFn: \(\) => fetchModelsForMake\(selectedMake!\),\s*enabled: !!selectedMake\s*\}\);\n', '', content)

content = re.sub(r'  const handleDiagnose = \(\) => \{\n    navigate\(\'/diagnose\'\);\n  \};\n', '', content)

with open('src/pages/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
