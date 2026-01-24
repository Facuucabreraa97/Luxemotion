const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const REPORT_FILE = path.join(ROOT_DIR, 'AUDIT_REPORT.md');

// Configuration
const EXTENSIONS = ['.ts', '.tsx', '.css', '.scss'];
// Extended Immunity List
const IMMUNE_KEYWORDS = [
    "Velvet", "Marketplace", "Casting", "Credits", "Stripe", "Generation", "Adult", "Private",
    "App", "main", "main.tsx", "index.css",
    "Billing", "Settings", "Tooltip", "MobileHeader", // Protected due to regex fragility risks
    "vite-env"
];
const LOW_VALUE_THRESHOLD_BYTES = 50;

// State
let allFiles = new Set();
let importedFiles = new Set();

// Helper: Recursive file finding
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            const ext = path.extname(fullPath);
            if (EXTENSIONS.includes(ext) || ext === '.d.ts') { // Include d.ts in search but handle specially
                allFiles.add(fullPath);
            }
        }
    });
}

// Helper: Resolve import path
function resolvePath(currentFile, importPath) {
    if (!importPath) return null;
    // Handle alias
    if (importPath.startsWith('@/')) {
        return path.join(SRC_DIR, importPath.slice(2));
    }
    // Handle relative
    if (importPath.startsWith('.')) {
        return path.resolve(path.dirname(currentFile), importPath);
    }
    return null;
}

// Helper: Check if file exists with extensions
function resolveFileWithExtensions(basePath) {
    if (allFiles.has(basePath)) return basePath;
    const checkExts = [...EXTENSIONS, '.d.ts', '.json'];
    for (const ext of checkExts) {
        if (allFiles.has(basePath + ext)) return basePath + ext;
        if (allFiles.has(path.join(basePath, 'index' + ext))) return path.join(basePath, 'index' + ext);
    }
    return null;
}

console.log('Scanning files...');
walkDir(SRC_DIR);

console.log('Building dependency graph...');
allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Improved Regexes
    // import ... from "..."
    // import "..."
    const importRegex = /import\s+(?:[^"';]*\s+from\s+)?['"]([^"']+)['"]/g;

    // import("...") - allow spaces
    const dynamicImportRegex = /import\s*\(\s*['"]([^"']+)['"]\s*\)/g;

    // export ... from "..."
    const exportRegex = /export\s+(?:[^"';]*\s+from\s+)?['"]([^"']+)['"]/g;

    const processMatch = (regex) => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const importPath = match[1];
            const resolvedBase = resolvePath(file, importPath);
            if (resolvedBase) {
                const resolvedFile = resolveFileWithExtensions(resolvedBase);
                if (resolvedFile) {
                    importedFiles.add(resolvedFile);
                }
            }
        }
    };

    processMatch(importRegex);
    processMatch(dynamicImportRegex);
    processMatch(exportRegex);
});

// Orphans
const orphans = [];
allFiles.forEach(file => {
    if (!importedFiles.has(file)) {
        const relPath = path.relative(SRC_DIR, file);
        // Exclude entry points and d.ts
        if (!relPath.startsWith('main.') && !relPath.startsWith('App.') && !file.endsWith('.d.ts')) {
            orphans.push(file);
        }
    }
});

// Filter Immune
const toDelete = [];
const immune = [];
const lowValue = [];

orphans.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(ROOT_DIR, file);

    const isImmune = IMMUNE_KEYWORDS.some(k => relPath.includes(k) || content.includes(k));

    if (isImmune) {
        immune.push(file);
    } else {
        toDelete.push(file);
    }
});

// Low Value Analysis
allFiles.forEach(file => {
    if (toDelete.includes(file) || immune.includes(file)) return;
    const content = fs.readFileSync(file, 'utf-8');
    if (content.length < LOW_VALUE_THRESHOLD_BYTES || content.includes("Lorem ipsum")) {
        lowValue.push(file);
    }
});

// Report
let report = `# SINGULARITY AUDIT REPORT\n\n`;
report += `## ORPHAN FILES (Candidate for Deletion)\n`;
if (toDelete.length === 0) report += `*None*\n`;
toDelete.forEach(f => report += `- [DELETE] ${path.relative(ROOT_DIR, f)}\n`);

report += `\n## IMMUNE ORPHANS (Protected)\n`;
if (immune.length === 0) report += `*None*\n`;
immune.forEach(f => report += `- [KEEP] ${path.relative(ROOT_DIR, f)}\n`);

report += `\n## LOW VALUE CANDIDATES\n`;
if (lowValue.length === 0) report += `*None*\n`;
lowValue.forEach(f => report += `- [WARN] ${path.relative(ROOT_DIR, f)}\n`);

fs.writeFileSync(REPORT_FILE, report);
console.log(`Audit Complete. Report saved to ${REPORT_FILE}`);
console.log(`Orphans to delete: ${toDelete.length}`);
console.log(`Immune files: ${immune.length}`);
