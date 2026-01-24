import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/App.tsx');

if (fs.existsSync(filePath)) {
    console.log(`Reading ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    const cleanLines = lines.filter(line => {
        if (line.includes('TalentPage')) return false;
        if (line.includes('casting')) return false;
        if (line.includes('Sentinel')) return false;
        return true;
    });

    if (cleanLines.length !== lines.length) {
        fs.writeFileSync(filePath, cleanLines.join('\n'));
        console.log(`✅ Cleaned App.tsx. Removed ${lines.length - cleanLines.length} lines.`);
    } else {
        console.log("no changes needed.");
    }
} else {
    console.log("App.tsx not found.");
}
