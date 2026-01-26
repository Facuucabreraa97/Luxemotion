import fs from 'fs';
import { execSync } from 'child_process';

const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

try {
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.length > 0)
        .filter(file => file.startsWith('src/') && (file.endsWith('.ts') || file.endsWith('.tsx')));

    let totalQueries = 0;
    let potentiallyExpensive = 0;

    stagedFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');

            const queries = (content.match(/supabase\.from/g) || []).length;
            totalQueries += queries;

            // Basic heuristic for queries that might fetch a lot of data
            if (content.includes('.select(\'*\')') || content.includes('.select("*")')) {
                potentiallyExpensive++;
            }
        }
    });

    if (totalQueries > 0) {
        console.log(`\n${BLUE}💰 Cost Estimator Insight:${RESET}`);
        console.log(`   - New DB Queries detected: ${totalQueries}`);
        if (potentiallyExpensive > 0) {
            console.log(`   - ⚠️  ${potentiallyExpensive} queries use SELECT * (High Read Cost Risk). Consider selecting specific columns.`);
        } else {
            console.log(`   - Query patterns look optimized.`);
        }
    }

} catch (error) {
    // Silent fail
}
