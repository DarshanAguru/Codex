const fs = require('fs');
const path = require('path');

const dsaFolder = path.join(__dirname, '../dsa');
const summariesFolder = path.join(__dirname, '../Summaries');
const dsaOutputFile = path.join(__dirname, '../assets/files.json');
const summariesOutputFile = path.join(__dirname, '../assets/summaries.json');

// Ensure output directory exists
const outputDir = path.dirname(dsaOutputFile);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    const files = fs.readdirSync(dsaFolder);
    const fileList = [];

    files.forEach(file => {
        const fullPath = path.join(dsaFolder, file);
        const stats = fs.statSync(fullPath);

        if (stats.isFile()) {
            let customDate = null;
            let timestamp = stats.mtimeMs; // Default to file modification time

            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const dateMatch = content.match(/\/\/\s*Date:\s*(.*)/i);
                if (dateMatch) {
                    const rawDate = dateMatch[1].trim();
                    customDate = rawDate; // Keep raw for reference or specific display

                    // Parse timestamp for sorting
                    // Try DD/MM/YYYY
                    const dmy = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                    if (dmy) {
                        timestamp = new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`).getTime();
                    }
                    // Try DD-MM-YYYY
                    else if (rawDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)) {
                        const parts = rawDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                        timestamp = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`).getTime();
                    }
                    // Try YYYY-MM-DD
                    else if (rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)) {
                        timestamp = new Date(rawDate).getTime();
                    }
                }
            } catch (readErr) {
                console.warn(`Could not read file content for ${file}:`, readErr);
            }

            fileList.push({
                name: file,
                path: `dsa/${file}`,
                size: stats.size,
                timestamp: timestamp || 0,
                displayDate: customDate,
                type: 'file'
            });
        }
    });

    fs.writeFileSync(dsaOutputFile, JSON.stringify(fileList, null, 2));
    console.log(`Successfully generated ${dsaOutputFile} with ${fileList.length} files.`);

    // --- Generate Summaries Index ---
    const summaryList = [];
    if (fs.existsSync(summariesFolder)) {
        const summaryFiles = fs.readdirSync(summariesFolder);
        summaryFiles.forEach(file => {
            const fullPath = path.join(summariesFolder, file);
            const stats = fs.statSync(fullPath);
            if (stats.isFile() && file.endsWith('.md')) {
                summaryList.push({
                    name: file,
                    path: `Summaries/${file}`,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    type: 'file'
                });
            }
        });
        fs.writeFileSync(summariesOutputFile, JSON.stringify(summaryList, null, 2));
        console.log(`Successfully generated ${summariesOutputFile} with ${summaryList.length} files.`);
    } else {
        console.warn(`Summaries folder not found at ${summariesFolder}`);
        fs.writeFileSync(summariesOutputFile, "[]");
    }

} catch (err) {
    console.error('Error generating index:', err);
    process.exit(1);
}
