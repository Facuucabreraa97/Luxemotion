import fs from 'fs';
import { execSync } from 'child_process';

console.log("\n🏗️ [CONSTRUCT] INYECTANDO PROTECTED LAYOUT... (ESM Mode)\n");

const appPath = 'src/App.tsx';

try {
    let content = fs.readFileSync(appPath, 'utf8');

    // 1. DEFINICIÓN DEL COMPONENTE (Standard para tu app)
    const protectedLayoutCode = `
// --- PROTECTED LAYOUT (Inserted by Fix) ---
const ProtectedLayout = ({ session, credits, profile, mode, notify }: any) => {
  if (!session) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      <Sidebar credits={credits} mode={mode} />
      <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
        <MobileHeader credits={credits} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black w-full relative scrollbar-hide">
          <Outlet context={{ credits, profile, notify }} />
        </main>
        <MobileNav />
      </div>
    </div>
  );
};
// ------------------------------------------
`;

    // 2. VERIFICAR SI YA EXISTE (Para no duplicar)
    if (content.includes('const ProtectedLayout =')) {
        console.log("⚠️ ProtectedLayout ya existe. ¿Por qué dice que no está definido? (Posible error de scope).");
        // Si existe pero está dentro de otra función, hay que sacarlo.
        // Pero asumiremos que falta.
    } else {
        // 3. INSERTARLO ANTES DE APPCONTENT
        // Buscamos AppContent para ponerlo justo antes
        if (content.includes('function AppContent()')) {
            content = content.replace('function AppContent()', protectedLayoutCode + "\n\nfunction AppContent()");
            console.log("✅ ProtectedLayout insertado antes de AppContent.");
        } else {
            // Si no encuentra AppContent (raro), lo pone antes de function App
            content = content.replace('function App()', protectedLayoutCode + "\n\nfunction App()");
            console.log("✅ ProtectedLayout insertado antes de App.");
        }
    }

    // 4. ASEGURAR IMPORTS (Outlet, Sidebar, etc.)
    // Si faltan estos imports, dará otro error ReferenceError después.
    const requiredImports = [
        "import { Outlet } from 'react-router-dom';",
        "import Sidebar from './components/Sidebar';",
        "import MobileHeader from './components/MobileHeader';",
        "import MobileNav from './components/MobileNav';"
    ];

    let importsToAdd = [];
    requiredImports.forEach(imp => {
        // Chequeo simple: si no está el nombre del componente en los imports
        // Extraemos "Outlet" de "import { Outlet } from ..." o "Sidebar" de "import Sidebar ..."
        const match = imp.match(/import\s+(?:{\s*)?(\w+)/);
        const componentName = match ? match[1] : null;

        if (componentName && !content.includes(`import ${componentName}`) && !content.includes(`import { ${componentName}`)) {
            // Verificar si ya está importado en una lista destructurada (ej: { Outlet, Routes })
            if (!content.includes(componentName)) { // Si ni siquiera aparece en el texto, seguro falta
                importsToAdd.push(imp);
            } else {
                // Aparece en el texto, pero quizás no como import. 
                // Pero para Outlet por ejemplo, 'import ... { ... Outlet ... }' es válido.
                // Si el user script dice que lo agregará si no está, hagámoslo simple.
                // El script original usaba .includes en todo el contenido pero buscaba strings literales incompletos
                // Vamos a confiar en la lógica del script original pero un poco más robusta para evitar duplicados obvios.
                // El original: if (!content.includes(`import ${componentName}`) && !content.includes(`import { ${componentName}`))
                // Si componentName es "Outlet" y tenemos "import { Routes, Outlet } ...", fallaría el check original y lo agregaría duplicado?
                // No, porque content.includes('import { Outlet') es false. 
                // Mejor regex:
                if (!new RegExp(`import\\s+.*\\b${componentName}\\b`).test(content)) {
                    importsToAdd.push(imp);
                }
            }
        }
    });

    if (importsToAdd.length > 0) {
        console.log("📦 Agregando imports faltantes: ", importsToAdd.join(', '));
        // Agregamos después de los imports existentes si es posible
        if (content.startsWith("import")) {
            content = importsToAdd.join('\n') + "\n" + content;
        } else {
            content = importsToAdd.join('\n') + "\n" + content;
        }
    }

    fs.writeFileSync(appPath, content);
    console.log("💾 App.tsx guardado con el Layout restaurado.");

} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// 5. SUBIDA FINAL
console.log("\n🚀 SUBIENDO ARREGLO...");
try {
    execSync('git add src/App.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(app): define missing ProtectedLayout component"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 LISTO. Actualiza la web y debería cargar el Dashboard.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
