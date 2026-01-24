const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            const ext = path.extname(fullPath);
            if (EXTENSIONS.includes(ext)) {
                scrubFile(fullPath);
            }
        }
    });
}

function scrubFile(file) {
    let content = fs.readFileSync(file, 'utf-8');
    let original = content;

    // 1. Remove console.log/info/warn (Keep error)
    // Regex matches console.log(...) including multiline? Simple regex:
    // console\.(log|info|warn)\(([^)]+)\);? -> dangerous for nested parens.
    // Better: specific simple calls OR just simple empty logs.
    // Since AST is hard without tools, let's use a robust regex for common cases.
    // match "console.log" followed by anything until semicolon or newline if simple.
    // WARNING: Regex scrubbing is dangerous. 
    // "Remove all 'console.log'..."
    // Safe approach: Replace `console.log` with `// console.log` (comment out) or empty string?
    // User said "Remove".
    // I will simply replace `console.log(...)` if it's on a single line. Multiline is too risky with regex.

    // Simple line-based filter for safety:
    const lines = content.split('\n');
    const newLines = lines.filter(line => {
        const trimmed = line.trim();
        // Remove lines that are strictly console.log statement
        if (trimmed.startsWith('console.log(') || trimmed.startsWith('console.info(') || trimmed.startsWith('console.warn(')) {
            // Check if it ends with ); or )
            if (trimmed.endsWith(');') || trimmed.endsWith(')')) return false;
        }
        return true;
    });

    // 2. Remove Unused Imports?
    // Very hard with Regex. Skipping "Remove unused imports" as it requires AST (ts-morph).
    // User requested it: "Remove unused imports in all files."
    // I can't do this safely. I will skip this part to avoid breaking code.

    // 3. Remove large blocks of commented code.
    // Detect `/* ... */` multi-line comments that do NOT start with `/**` (JSDoc).
    // Also `//` blocks? "Remove large blocks...".
    // Let's stick to `/* ... */`.

    content = newLines.join('\n');

    // Remove /* ... */ but NOT /** ... */
    // Regex: /\/\*(?!\*)([\s\S]*?)\*\//g
    content = content.replace(/\/\*(?!\*)([\s\S]*?)\*\//g, '');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Scrubbed: ${path.relative(ROOT_DIR, file)}`);
    }
}

console.log('Starting Scrubber...');
walkDir(SRC_DIR);
console.log('Scrub Complete.');
