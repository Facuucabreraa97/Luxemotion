import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import process from 'process';

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const FORBIDDEN_PATTERNS = [
    {
        regex: /update\(\s*\{\s*credits\s*:/,
        message: 'CRITICAL: Direct frontend modification of "credits" detected. Use Edge Functions.'
    },
    {
        regex: /rpc\(['"]admin_/,
        message: 'WARNING: Admin RPC call detected in frontend. Ensure this is protected by RLS or move to Edge Function.'
    },
    {
        regex: /Deno\.env/,
        message: 'CRITICAL: Edge Function env var usage found in Frontend code. This will leak secrets.'
    },
    {
        regex: /process\.env\.SUPABASE_SERVICE_ROLE/,
        message: 'CRITICAL: Service Role Key detected in Frontend. IMMEDIATE ACTION REQUIRED.'
    }
];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let hasError = false;

        FORBIDDEN_PATTERNS.forEach(pattern => {
            if (pattern.regex.test(content)) {
                console.error(`${RED}${pattern.message}${RESET}`);
                console.error(`  File: ${filePath}`);
                hasError = true;
            }
        });

        return hasError;
    } catch (err) {
        return false;
    }
}

try {
    // Get staged files from git
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.length > 0)
        .filter(file => file.startsWith('src/') && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')));

    if (stagedFiles.length === 0) {
        process.exit(0);
    }

    console.log('🛡️  Running Security Guardrail on staged files...');

    let issuesFound = false;
    stagedFiles.forEach(file => {
        if (fs.existsSync(file)) {
            if (scanFile(file)) {
                issuesFound = true;
            }
        }
    });

    if (issuesFound) {
        console.error(`\n${RED}Security check failed. Please fix the issues above.${RESET}`);
        console.error(`${YELLOW}To bypass (NOT RECOMMENDED), use: git commit --no-verify${RESET}`);
        process.exit(1);
    } else {
        console.log('✅ Security check passed.');
    }

} catch (error) {
    console.error('Error running security guardrail:', error.message);
    process.exit(0);
}
