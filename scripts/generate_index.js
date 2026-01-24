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
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const dateMatch = content.match(/\/\/\s*Date:\s*(.*)/i);
                if (dateMatch) {
                    customDate = dateMatch[1].trim();
                }
            } catch (readErr) {
                console.warn(`Could not read file content for ${file}:`, readErr);
            }

            fileList.push({
                name: file,
                path: `dsa/${file}`,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                customDate: customDate, // Added custom date field
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
