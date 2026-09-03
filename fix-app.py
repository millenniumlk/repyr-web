with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import AllMakes' not in content:
    content = content.replace("import HomePage from './pages/HomePage';", "import HomePage from './pages/HomePage';\nimport AllMakes from './pages/AllMakes';\nimport BrandCatalog from './pages/BrandCatalog';")

target = "element: <HomePage />,\n      },"
replacement = "element: <HomePage />,\n      },\n      { path: '/cars', element: <AllMakes /> },\n      { path: '/cars/:make', element: <BrandCatalog /> },\n      { path: '/cars/:make/:model', element: <BrandCatalog /> },\n      { path: '/cars/:make/:model/:year', element: <BrandCatalog /> },"

content = content.replace(target, replacement)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
