const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_FILE = path.join(ROOT_DIR, 'AUDIT_REPORT.md');

if (!fs.existsSync(REPORT_FILE)) {
    console.error('Audit report not found!');
    process.exit(1);
}

const content = fs.readFileSync(REPORT_FILE, 'utf-8');
const lines = content.split('\n');
let deletedCount = 0;

console.log('Starting Purge...');

lines.forEach(line => {
    if (line.startsWith('- [DELETE]')) {
        const relPath = line.replace('- [DELETE] ', '').trim();
        const fullPath = path.join(ROOT_DIR, relPath);

        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`Deleted: ${relPath}`);
                deletedCount++;
            } catch (e) {
                console.error(`Failed to delete ${relPath}: ${e.message}`);
            }
        } else {
            console.warn(`File not found (already deleted?): ${relPath}`);
        }
    }
});

console.log(`Purge Complete. Deleted ${deletedCount} files.`);
